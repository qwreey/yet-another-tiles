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

const { Gdk, Gio, GLib, GObject, Gtk } = imports.gi
const Gettext = imports.gettext
const ExtensionUtils = imports.misc.extensionUtils

// libadwaita is available after GNOME Shell 42
let Adw = null
try { Adw = imports.gi.Adw } catch {}

const Me = ExtensionUtils.getCurrentExtension()
const Constants = Me.imports.constants
const Utils = Me.imports.utils

const Domain = Gettext.domain(Me.metadata.uuid)
const { gettext } = Domain

var PrefsWidget = GObject.registerClass({
  Implements: [Gtk.BuilderScope],
}, class PrefsWidget extends GObject.Object {
  _init(window) {
    super._init()

    this._settings = ExtensionUtils.getSettings()
    this._window = window

    this._createBuilder()
    if (Adw) this._createActions()
    this._bindSettings()
    this._bindShortcutWidgets()

    // enable search, configure window
    window.set_search_enabled(true)
    window.set_default_size(500, 800)

    this._pages = [
      this._builder.get_object("general"),
      this._builder.get_object("keybinding"),
    ]
  }

  _createBuilder() {
    const builder = this._builder = new Gtk.Builder()
    builder.set_scope(this)
    builder.set_translation_domain(Me.metadata.uuid)
    builder.add_from_file(Me.dir.get_child(Adw ? 'prefs.adw.ui' : 'prefs.gtk.ui').get_path())

    const InternalChildren = [
      'restore_window_size',
      'enable_window_animation',
      'next_step_timeout',
      'gap_size_increments',
      'gap_size',
      'gaps_between_windows',
      'align_window_to_center',
      'increase_gap_size',
      'decrease_gap_size',
      'tiling_steps_center',
      'tiling_steps_side',
      'tile_window_to_center',
      'tile_window_to_left',
      'tile_window_to_right',
      'tile_window_to_top',
      'tile_window_to_top_left',
      'tile_window_to_top_right',
      'tile_window_to_bottom',
      'tile_window_to_bottom_left',
      'tile_window_to_bottom_right',
    ]

    InternalChildren.forEach(id=>this['_'+id]=builder.get_object(id))
  }
  
  _createActions() {
    // Many extensions are uses this hack. such as Search Light, Destkop Cube, Burn My Windows and Blur my Shell ...
    let menu_util = builder.get_object('menu_util')
    window.add(menu_util)

    // a little hack to get to the headerbar
    const page = this._builder.get_object('menu_util')
    const pages_stack = page.get_parent() // AdwViewStack
    const content_stack = pages_stack.get_parent().get_parent() // GtkStack
    const preferences = content_stack.get_parent() // GtkBox
    const headerbar = preferences.get_first_child() // AdwHeaderBar
    headerbar.pack_start(builder.get_object('info_menu'))


    const actionGroup = this._actions = new Gio.SimpleActionGroup()
    this._window.insert_action_group('prefs', actionGroup)

    const repositoryAction = new Gio.SimpleAction({ name: 'open-source' })
    repositoryAction.connect('activate', this._openURL.bind(this,"https://github.com/velitasali/gnome-shell-extension-awesome-tiles"))
    actionGroup.add_action(repositoryAction)

    const bugReportAction = new Gio.SimpleAction({ name: 'open-bug-report' })
    bugReportAction.connect('activate', this._openURL.bind(this,"https://github.com/velitasali/gnome-shell-extension-awesome-tiles/issues/new"))
    actionGroup.add_action(bugReportAction)
  }

  _bindSettings() {
    this._settings.bind(
      'restore-window-size',
      this._restore_window_size,
      'active',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'enable-window-animation',
      this._enable_window_animation,
      'active',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'next-step-timeout',
      this._next_step_timeout,
      'value',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'gap-size-increments',
      this._gap_size_increments,
      'value',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'gap-size',
      this._gap_size,
      'value',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'enable-inner-gaps',
      this._gaps_between_windows,
      'active',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'tiling-steps-center',
      this._tiling_steps_center.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT,
    )

    this._settings.bind(
      'tiling-steps-side',
      this._tiling_steps_side.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT,
    )
  }

  _bindShortcutWidgets() {
    this._shortcutWidgets = [
      this._align_window_to_center,
      this._increase_gap_size,
      this._decrease_gap_size,
      this._tile_window_to_center,
      this._tile_window_to_left,
      this._tile_window_to_right,
      this._tile_window_to_top,
      this._tile_window_to_top_left,
      this._tile_window_to_top_right,
      this._tile_window_to_bottom,
      this._tile_window_to_bottom_left,
      this._tile_window_to_bottom_right,
    ]

    this._shortcutWidgets.forEach((widget) => {
      this._settings.connect("changed::" + widget.get_name(), () => {
        this._reloadShortcutWidget(widget)
      })
    })

    this._shortcutWidgets.forEach(this._reloadShortcutWidget.bind(this))
  }

  _onAssignShortcut(widget) {
    const dialog = new ShortcutDialog(this._settings, widget.get_name())
    dialog.set_transient_for(this._window)
    dialog.present()
  }

  _reloadShortcutWidget(widget) {
    const shortcut = this._settings.get_strv(widget.get_name())
    widget.label = shortcut?.length > 0 ? shortcut[0] : gettext('Disabled');
  }

  _openURL(url) {
    Gtk.show_uri(this._window, url, Gdk.CURRENT_TIME)
  }

  vfunc_create_closure(builder, handlerName, flags, connectObject) {
    if (flags & Gtk.BuilderClosureFlags.SWAPPED) {
      throw new Error('Unsupported template signal flag "swapped"')
    }

    if (typeof this[handlerName] === 'undefined') {
      throw new Error(`${handlerName} is undefined`)
    }

    return this[handlerName].bind(connectObject || this)
  }
})

const ShortcutDialog = class {
  constructor(settings, shortcut) {
    this._builder = new Gtk.Builder()
    this._builder.add_from_file(GLib.build_filenamev([Me.path, 'prefs-shortcut-dialog.ui']))

    this.widget = this._builder.get_object('dialog')

    this._connectSettings(settings, shortcut)

    return this.widget
  }

  _connectSettings(settings, shortcut) {
    const eventController = this._builder.get_object('event-controller')
    eventController.connect('key-pressed', (_widget, keyval, keycode, state) => {
      let mask = state & Gtk.accelerator_get_default_mod_mask()
      mask &= ~Gdk.ModifierType.LOCK_MASK

      if (mask === 0 && keyval === Gdk.KEY_Escape) {
        this.widget.visible = false
        return Gdk.EVENT_STOP
      }

      if (keyval === Gdk.KEY_BackSpace) {
        settings.set_strv(shortcut, [])
        this.widget.close()
      } else if (Utils.isBindingValid({ mask, keycode, keyval }) && Utils.isAccelValid({ mask, keyval })) {
        const binding = Gtk.accelerator_name_with_keycode(
          null,
          keyval,
          keycode,
          mask
        )
        settings.set_strv(shortcut, [binding])
        this.widget.close()
      }

      return Gdk.EVENT_STOP
    })
  }
}

function init() {
  ExtensionUtils.initTranslations(Me.metadata.uuid)
}

function fillPreferencesWindow(window) {
  // Add pages/actions
  const perfs = new PrefsWidget(window)
  perfs._pages.forEach(page=>window.add(page))
}

function buildPrefsWidget() {}
