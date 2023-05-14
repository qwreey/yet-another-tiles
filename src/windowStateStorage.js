const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { StateStorage } = Me.imports.utils

var WindowStateStorage = class WindowStateStorage extends StateStorage {
  constructor(settings) {
    super()

    // restore window size when user drags window
    this._grabOpBeginId = global.display.connect('grab-op-begin', (display, window, op) => {
      this.remove(window.get_id(),true)
    })

    // remove window state when user resizes window
    this._sizeChangeId = global.window_manager.connect('size-change', (wm, actor, op, oldFrameRect, oldBufferRect) => {
      if (!actor) return
      this.remove(actor.meta_window.get_id())
    })
  }
  removeHook(_,state,restoreWindowSize) {
    if (restoreWindowSize) {
      const untiledRect = state.untiledRect
      const rect = state.window.get_frame_rect()
      state.window.move_resize_frame(false, rect.x, rect.y, untiledRect.width, untiledRect.height)
    }
  }
  destroy() {
    global.display.disconnect(this._grabOpBeginId)
    global.window_manager.disconnect(this._sizeChangeId)
    this._grabOpBeginId = this._sizeChangeId = this.removeHook = null
    super.destroy()
  }
}
