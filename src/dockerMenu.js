/*
 * Gnome3 Docker Menu Extension
 * Copyright (C) 2017 Guillaume Pouilloux <gui.pouilloux@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const DockerSubMenuMenuItem = Me.imports.src.dockerSubMenuMenuItem;
const DockerMenuStatusItem = Me.imports.src.dockerMenuStatusItem;
const Util = Me.imports.src.util;

// Docker icon on status menu
var DockerMenu = new Lang.Class({
    Name: 'DockerMenu.DockerMenu',
    Extends: PanelMenu.Button,

    // Init the docker menu
    _init: function () {
        this.parent(0.0, _("Docker containers"));

        const hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        const gicon = Gio.icon_new_for_string(Me.path + "/docker-symbolic.svg");
        const dockerIcon = new St.Icon({
            gicon: gicon,
            // Docker logo looks a little small at the right size
            icon_size: Math.round(Panel.PANEL_ICON_SIZE * 1.2),
            style_class: 'system-status-icon'
        });

        hbox.add_child(dockerIcon);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(hbox);
        this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

        this._renderMenu();
    },

    // Refresh  the menu everytime the user click on it
    // It allows to have up-to-date information on docker containers
    _refreshMenu: function () {
        if (this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    // Show docker menu icon only if installed and append docker containers
    _renderMenu: function() {
        if (Docker.isDockerInstalled()) {
          // Add Turn On / Turn Off Switch always
          let statusSwitch = new DockerMenuStatusItem.DockerMenuStatusItem('Docker');
          this.menu.addMenuItem(statusSwitch);

          if (Docker.isDockerRunning()) {
              this._feedMenu();
          }
        } else {
          let errMsg = _("Docker binary not found in PATH");
          this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
          log(errMsg);
        }
        this.actor.show();
    },

    // Append containers to menu
    _feedMenu: function () {
        try {
            const containers = Docker.getContainers();
            if (containers.length > 0) {
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                containers.forEach((container) => {
                    log(container.name);
                    log(container.status);
                    const subMenu = new DockerSubMenuMenuItem.DockerSubMenuMenuItem(container.name, container.status);
                    this.menu.addMenuItem(subMenu);
                });
            }
        } catch (err) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            const errMsg = "Error occurred when fetching containers";
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(errMsg));
            log(errMsg);
            log(err);
        }
    }
});

