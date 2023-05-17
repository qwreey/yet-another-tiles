const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { StateStorage } = Me.imports.utils
const { Meta } = imports.gi

const moveOps = [Meta.GrabOp.MOVING, Meta.GrabOp.KEYBOARD_MOVING]

var WindowStateStorage = class WindowStateStorage extends StateStorage {
  constructor(settings) {
    super()
    this._settings = settings

    // window dragging (e: titlebar dragging, super+dragging, resizing by dragging edge)
    this._grabOpBeginId = global.display.connect('grab-op-begin', (display, window, op) => {
      // true when only moves, (exclude resizing by dragging edge)
      const moveWindow = moveOps.includes(op & ~1024)

      // restore window size when user drags window
      this.remove(window.get_id(),moveWindow)
    })

    // remove window state when user resizes window
    this._sizeChangeId = global.window_manager.connect('size-change', (wm, actor, op, oldFrameRect, oldBufferRect) => {
      if (!actor) return
      this.remove(actor.meta_window.get_id(),false)
    })
  }

  // save windows state to settings.
  // (prevents the extension from losing its window state when the screen is locked)
  saveState() {

  }
  // load windows state to settings.
  loadState() {

  }

  removeHook(window,state,restoreWindowSize) {
    if (restoreWindowSize && this._settings.restoreWindowSize) {
      const untiledRect = state.untiledRect
      const rect = state.window.get_frame_rect()
      state.window.move_resize_frame(false, rect.x, rect.y, untiledRect.width, untiledRect.height)
    }
  }
  destroy() {
    this.saveState()
    global.display.disconnect(this._grabOpBeginId)
    global.window_manager.disconnect(this._sizeChangeId)
    this._grabOpBeginId = this._sizeChangeId = this.removeHook = null
    super.destroy()
  }
}
