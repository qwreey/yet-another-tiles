/*
 * Copyright (C) 2021 Pim Snel
 * Copyright (C) 2021 Veli Tasalı
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Gettext = imports.gettext
const Main = imports.ui.main
const { Gio } = imports.gi

const { GAP_SIZE_MAX } = Me.imports.constants
const { StateStorage } = Me.imports.utils
const { WindowMover } = Me.imports.windowMover
const { Settings } = Me.imports.settings

const Domain = Gettext.domain(Me.metadata.uuid)
const { ngettext } = Domain

class WindowStateStorage extends StateStorage {

}

class Extension {
  enable() {
    this._windowMover = new WindowMover()
    this._settings = new Settings()
    this._windowState = new StateStorage()
    this._osdGapChangedIcon = Gio.icon_new_for_string("view-grid-symbolic")

    this._settings
      .bindShortcut("shortcut-align-window-to-center",     this._alignWindowToCenter.bind(this))
      .bindShortcut("shortcut-tile-window-to-center",      this._tileWindowCenter.bind(this))
      .bindShortcut("shortcut-tile-window-to-left",        this._tileWindowLeft.bind(this))
      .bindShortcut("shortcut-tile-window-to-right",       this._tileWindowRight.bind(this))
      .bindShortcut("shortcut-tile-window-to-top",         this._tileWindowTop.bind(this))
      .bindShortcut("shortcut-tile-window-to-top-left",    this._tileWindowTopLeft.bind(this))
      .bindShortcut("shortcut-tile-window-to-top-right",   this._tileWindowTopRight.bind(this))
      .bindShortcut("shortcut-tile-window-to-bottom",      this._tileWindowBottom.bind(this))
      .bindShortcut("shortcut-tile-window-to-bottom-left", this._tileWindowBottomLeft.bind(this))
      .bindShortcut("shortcut-tile-window-to-bottom-right",this._tileWindowBottomRight.bind(this))
      .bindShortcut("shortcut-increase-gap-size",          this._increaseGapSize.bind(this))
      .bindShortcut("shortcut-decrease-gap-size",          this._decreaseGapSize.bind(this))
  }

  disable() {
    this._windowMover.destroy()
    this._settings.destroy()
    this._osdGapChangedIcon.run_dispose()
    this._settings = this._windowMover = this._osdGapChangedIcon = null
  }

  _alignWindowToCenter() {
    const window = global.display.get_focus_window()
    if (!window) return

    const windowArea = window.get_frame_rect()
    const monitor = window.get_monitor()
    const workspace = window.get_workspace()
    const workspaceArea = workspace.get_work_area_for_monitor(monitor)

    const x = Math.floor(
      workspaceArea.x + ((workspaceArea.width - windowArea.width) / 2),
    )
    const y = Math.floor(
      workspaceArea.y + ((workspaceArea.height - windowArea.height) / 2),
    )

    this._windowMover._setWindowRect(window, x, y, windowArea.width, windowArea.height, this._settings.isWindowAnimationEnabled)
  }

  _calculateWorkspaceArea(window) {
    const monitor = window.get_monitor()
    const monitorGeometry = global.display.get_monitor_geometry(monitor)
    const isVertical = monitorGeometry.width < monitorGeometry.height
  
    const workspace = window.get_workspace()
    const workspaceArea = workspace.get_work_area_for_monitor(monitor)
    const gap = this._settings.gapSize

    if (gap <= 0) return {
      x: workspaceArea.x,
      y: workspaceArea.y,
      height: workspaceArea.height,
      width: workspaceArea.width,
    }
    
    const gapUncheckedX = Math.round(gap / 200 * workspaceArea.width)
    const gapUncheckedY = Math.round(gap / 200 * workspaceArea.height)
    
    const gaps = {
      x: Math.min(gapUncheckedX, gapUncheckedY * 2),
      y: Math.min(gapUncheckedY, gapUncheckedX * 2),
    }
    
    // If the monitor is vertical, swap the gap values
    if (isVertical) {
      const temp = gaps.x
      gaps.x = gaps.y
      gaps.y = temp
    }

    return {
      x: workspaceArea.x + gaps.x,
      y: workspaceArea.y + gaps.y,
      height: workspaceArea.height - (gaps.y * 2),
      width: workspaceArea.width - (gaps.x * 2),
      isVertical: isVertical,
      gaps: gaps,
    }
  }

  _decreaseGapSize() {
    this._notifyGapSize(
      this._settings.gapSize = Math.max(this._settings.gapSize - this._settings.gapSizeIncrements, 0)
    )
  }

  _increaseGapSize() {
    this._notifyGapSize(
      this._settings.gapSize = Math.min(this.gapSize + this.gapSizeIncrements, GAP_SIZE_MAX)
    )
  }

  _notifyGapSize(gapSize) {
    Main.osdWindowManager.show(-1,this._osdGapChangedIcon,
      ngettext(
        'Gap size is now at %d percent',
        'Gap size is now at %d percent',
        gapSize
      ).format(gapSize),
      null,null,null
    )
  }

  _tileWindow(top, bottom, left, right) {
    const window = global.display.get_focus_window()
    if (!window) return

    const windowId = window.get_id()
    const now = Date.now()
    const center = !(top || bottom || left || right)
    const steps = center ? this._settings.tilingStepsCenter : this._settings.tilingStepsSide
    const workArea = this._calculateWorkspaceArea(window)
    let { x, y, width, height } = workArea
    
    // get last window tiling state, check timeout/update and update interation
    const prev = this._windowState.get(windowId)
    const nextStepTimeout = this._settings.nextStepTimeout
    const successive =
      prev && // this window has last state
      ((!nextStepTimeout) || (now - prev.time <= nextStepTimeout)) && // check timeout
      prev.top === top && prev.bottom === bottom && prev.left === left && prev.right === right // check direction matching
    const iteration = successive && (prev.iteration + 1)%steps.length || 0
    const step = 1.0 - steps[iteration]

    // update window tiling state
    this._windowState.add(windowId,{
      untiledRect: prev?.untiledRect || window.get_frame_rect(),
      top: top, bottom: bottom, left: left, right: right,
      time: now, iteration: iteration
    })

    // Special case - when tiling to the center we want the largest size to
    // cover the whole available space
    if (center) {
      const widthStep = isVertical ? step / 2 : step
      const heightStep = isVertical ? step : step / 2

      width -= width * widthStep
      height -= height * heightStep
      x += (workArea.width - width) / 2
      y += (workArea.height - height) / 2

    } else {
      if (left !== right) width -= width * step
      if (top !== bottom) height -= height * step
      if (!left) x += (workArea.width - width) / (right ? 1 : 2)
      if (!top) y += (workArea.height - height) / (bottom ? 1 : 2)

      if (this._settings.isInnerGapsEnabled && workArea.gaps !== undefined) {
        if (left !== right) {
          if (right) x += workArea.gaps.x / 2
          width -= workArea.gaps.x / 2
        }
        if (top !== bottom) {
          if (bottom) y += workArea.gaps.y / 2
          height -= workArea.gaps.y / 2
        }
      }
    }

    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)

    this._windowMover._setWindowRect(window, x, y, width, height, this._settings.isWindowAnimationEnabled)
  }

  _tileWindowBottom() {
    this._tileWindow(false, true, true, true)
  }

  _tileWindowBottomLeft() {
    this._tileWindow(false, true, true, false)
  }

  _tileWindowBottomRight() {
    this._tileWindow(false, true, false, true)
  }

  _tileWindowCenter() {
    this._tileWindow(false, false, false, false)
  }

  _tileWindowLeft() {
    this._tileWindow(true, true, true, false)
  }

  _tileWindowRight() {
    this._tileWindow(true, true, false, true)
  }

  _tileWindowTop() {
    this._tileWindow(true, false, true, true)
  }

  _tileWindowTopLeft() {
    this._tileWindow(true, false, true, false)
  }

  _tileWindowTopRight() {
    this._tileWindow(true, false, false, true)
  }
}

function init() {
  ExtensionUtils.initTranslations(Me.metadata.uuid)
  return new Extension()
}
