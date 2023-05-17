const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Main = imports.ui.main
const { Meta, Shell } = imports.gi

const { parseTilingSteps } = Me.imports.utils
const {
  TILING_STEPS_CENTER,
  TILING_STEPS_SIDE,
} = Me.imports.constants

var Settings = class Settings {
  constructor() {
    this._shortcutsBindingIds = []
    this._settings = ExtensionUtils.getSettings()
  }

  destroy() {
    this._shortcutsBindingIds.forEach((id) => Main.wm.removeKeybinding(id))
    this._settings.run_dispose()
    this._shortcutsBindingIds = this._settings = null
  }

  bindShortcut(name, callback) {
    const mode = Shell.hasOwnProperty('ActionMode') ? Shell.ActionMode : Shell.KeyBindingMode

    Main.wm.addKeybinding(
      name,
      this._settings,
      Meta.KeyBindingFlags.NONE,
      mode.ALL,
      callback
    )

    this._shortcutsBindingIds.push(name)

    return this
  }

  get restoreWindowSize() {
    return this._settings.get_boolean("restore-window-size")
  }

  get gapSizeIncrements() {
    return this._settings.get_int("gap-size-increments")
  }

  get gapSize() {
    return this._settings.get_int("gap-size")
  }

  set gapSize(intValue) {
    this._settings.set_int("gap-size", intValue)
  }

  get isInnerGapsEnabled() {
    return this._settings.get_boolean("enable-inner-gaps")
  }

  get tilingStepsCenter() {
    return parseTilingSteps(
      this._settings.get_string("tiling-steps-center"),
      TILING_STEPS_CENTER,
    )
  }

  get tilingStepsSide() {
    return parseTilingSteps(
      this._settings.get_string("tiling-steps-side"),
      TILING_STEPS_SIDE,
    )
  }

  get isWindowAnimationEnabled() {
    return this._settings.get_boolean("enable-window-animation")
  }

  get nextStepTimeout() {
    return this._settings.get_int("next-step-timeout")
  }
}
