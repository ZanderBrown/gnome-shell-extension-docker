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

const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const DockerRemoveDialog = Me.imports.src.dockerRemoveDialog;

// Docker actions for each container
var DockerMenuItem = new Lang.Class({
    Name: 'DockerMenu.DockerMenuItem',
    Extends: PopupMenu.PopupMenuItem,

    _init: function (containerName, dockerCommand) {
        this.parent(Docker.dockerCommandsToLabels[dockerCommand]);

        this.containerName = containerName;
        this.dockerCommand = dockerCommand;

        this.connect('activate', Lang.bind(this, this._dockerAction));
    },

    _callbackDockerAction: function (funRes) {
        if (funRes['status'] == 0) {
            let msg = "`" + funRes['cmd'] + "` " + _("terminated successfully");
            log(msg);
        } else {
            let errMsg = _("Error occurred when running") + " `" + funRes['cmd'] + "`";
            Main.notify(errMsg);
            log(errMsg);
            log(funRes['err']);
        }
    },

    _dockerAction: function () {
        if (this.dockerCommand === 'exec') {
            // This line assumes /bin/bash exists on the contianer
            let command = 'docker exec -it ' + this.containerName + ' /bin/bash';
            try {
                var app = Gio.AppInfo.create_from_commandline(command,
                    this.containerName,
                    Gio.AppInfoCreateFlags.NEEDS_TERMINAL);
                app.launch([], global.create_app_launch_context(0, -1));
            } catch (err) {
                Main.notify('Failed to open terminal for ' + this.containerName);
                log(err);
            }
            return;
        } else if (this.dockerCommand == 'rm') {
            let dialog = new DockerRemoveDialog.DockerRemoveDialog(this.containerName);
            dialog.open(global.get_current_time());
            return;
        }
        let dockerCmd = 'docker ' + this.dockerCommand + ' ' + this.containerName;
        log("Executing: " + dockerCmd)
        let res, out, err, status;
        Docker.async(function () {
            [res, out, err, status] = GLib.spawn_command_line_sync(dockerCmd);
            return {
                cmd: dockerCmd,
                res: res,
                out: out,
                err: err,
                status: status
            };
        }, this._callbackDockerAction);
    }
});
