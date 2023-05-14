
const { Meta, Clutter, Gio } = imports.gi
const RENDER_DELAY = 3+1 // ignore initial call / first frame call (on resized) / after call (window redraw) + time to render window

var WindowMover = class WindowMover {
  constructor() {
    this._windowAnimations = []
  }

  // deinit all animations
  destroy() {
    this._windowAnimations.forEach(animation=>this._destroyAnimation(animation))
    this._windowAnimations = null
  }

  // capture window content and create clone clutter
  _captureWindow(window_actor,rect) {
    return new Clutter.Actor({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      content: window_actor.paint_to_content(null)
    })
  }

  // give time to redraw it selfs to application
  // If canceled, return true
  _delayFrames(actor,animation) {
    return new Promise(resolve=>{
      const timeline = animation.timeline = new Clutter.Timeline({ actor:actor,duration: 1000 })
      let count = 0
      animation.resolve = resolve
      animation.newframe = timeline.connect("new-frame",()=>{
        if (++count < RENDER_DELAY) return 
        timeline.disconnect(animation.newframe)
        timeline.run_dispose()
        animation.resolve = animation.newframe = animation.timeline = null
        resolve()
      })
      timeline.start()
    })
  }

  // destroy last animation, Also cancel delayFraems
  _destroyAnimation(animation,keepTransitions) {
    const actor = animation.actor

    // remove animation from lists
    const index = this._windowAnimations.indexOf(animation)
    if (index != -1) this._windowAnimations.splice(index,1)
    
    // kill transitions
    if (!keepTransitions) {
      animation?.clone?.remove_all_transitions()
      animation?.clone?.destroy()
      if (actor) {
        actor.actor?.remove_all_transitions()
        actor.scale_x = 1
        actor.scale_y = 1
        actor.translation_x = 0
        actor.translation_y = 0
      }
      animation.clone = animation.actor = animation.window = null
    }

    // kill last delay
    const timeline = animation?.timeline
    if (timeline) {
      timeline.disconnect(animation.newframe)
      timeline.run_dispose()
      const resolve = animation.resolve
      actor.thaw()
      animation.resolve = animation.newframe = animation.timeline = null
      resolve(true)
    }
  }

  async _setWindowRect(window, x, y, width, height, animate) {

    const actor = window.get_compositor_private()
    const isMaximized = window.get_maximized()
    const lastAnimation = this._windowAnimations.find(item=>item.window === window)
    const thisAnimation = {}
    let clone

    // Calculate before size / position
    const innerRectBefore = window.get_frame_rect()
    const outterRectBefore = window.get_buffer_rect()
    const cloneGoalScaleX = width/innerRectBefore.width
    const cloneGoalScaleY = height/innerRectBefore.height
    const actorInitScaleX = innerRectBefore.width/width
    const actorInitScaleY = innerRectBefore.height/height
    const decoLeftBefore  = (innerRectBefore.x-outterRectBefore.x)
    const decoTopBefore   = (innerRectBefore.y-outterRectBefore.y)

    // destroy last animation and freeze actor
    if (lastAnimation) this._destroyAnimation(lastAnimation,animate) // destroy old animation (but keep keep transitions for smoother)
    actor.freeze() // do not render while real resizing done

    // unmaximize
    if (isMaximized) {
      // clone actor before unmaximize for animate maxed -> tiled
      clone = animate && this._captureWindow(actor,outterRectBefore)
      window.unmaximize(Meta.MaximizeFlags.BOTH)
      actor.remove_all_transitions() // remove unmaximize animation
    }

    // in another workspace
    if (!window.showing_on_its_workspace()) {
      if (lastAnimation) this._destroyAnimation(lastAnimation,animate)
      window.move_resize_frame(false, x, y, width, height)
      actor.thaw()
      return
    }

    // save this animation / clone window
    if (animate) {
      thisAnimation.clone = clone ??= this._captureWindow(actor,outterRectBefore)
      thisAnimation.window = window
      thisAnimation.actor = actor
      this._windowAnimations.push(thisAnimation)
    }

    // resize meta window / wait for window ready
    window.move_resize_frame(false, x, y, width, height)
    if (!animate) { // if no animate
      actor.thaw() // allow render window
      return
    }
    const resultDelay = await this._delayFrames(actor,thisAnimation) // wait once for window size updating
    if (lastAnimation) this._destroyAnimation(lastAnimation) // remove old transitions (actor easing)
    if (resultDelay) return // If canceled, just return
    global.window_group.insert_child_above(clone,actor) // insert clone on screen

    // Set real window actor position
    actor.scale_x = actorInitScaleX
    actor.scale_y = actorInitScaleY
    actor.translation_x = innerRectBefore.x - x
    actor.translation_y = innerRectBefore.y - y
    actor.thaw() // allow render window

    // Clone animation
    clone.ease_property('opacity', 0, {
      duration: 300,
      mode: Clutter.AnimationMode.EASE_OUT_QUART
    })
    clone.ease({
      scale_x: cloneGoalScaleX,
      scale_y: cloneGoalScaleY,
      x: x-decoLeftBefore*cloneGoalScaleX,
      y: y-decoTopBefore*cloneGoalScaleY,
      duration: 300,
      mode: Clutter.AnimationMode.EASE_OUT_EXPO,
    })

    // Real window animation
    actor.ease({
      scale_x: 1,
      scale_y: 1,
      translation_x: 0,
      translation_y: 0,
      duration: 300,
      mode: Clutter.AnimationMode.EASE_OUT_EXPO,
      onStopped: ()=>{
        const nowAnimation = this._windowAnimations.find(item=>item.window === window)
        if (nowAnimation?.clone === clone) this._destroyAnimation(nowAnimation)
      }
    })
  }

  async _resizeWindow(window,x,y) {}
}
