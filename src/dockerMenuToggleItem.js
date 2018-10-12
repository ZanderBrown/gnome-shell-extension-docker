/**
 * Docker menu extension
 * @author Zander Brown <zbrown@gnome.org>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/

'use strict';

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;

// Docker container status (start/stop)
var DockerMenuToggleItem = new Lang.Class({
    Name: 'DockerMenu.DockerMenuToggleItem',
    Extends: PopupMenu.PopupSwitchMenuItem,

    _init: function (lbl, container, cmds, active) {
        // Set Switch state
        this.parent(lbl, active);
        this._active = active;
        this._container = container;
        this._cmds = cmds;

        this.connect('activate', Lang.bind(this, this._toggle));
    },

    _toggle: function () {
        let act = this._active ? this._cmds[1] : this._cmds[0];
        let dockerCmd = 'docker ' + act+ ' ' + this._container;
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
        }, res => {
            if (res['status'] == 0) {
                this._active = !this._active;
                let msg = "`" + res['cmd'] + "` " + _("terminated successfully");
                log(msg);
            } else {
                let errMsg = _("Error occurred when running") + " `" + res['cmd'] + "`";
                Main.notify(errMsg);
                log(errMsg);
                log(res['err']);
            }
            this.setToggleState(this._active);
        });
    }
});
