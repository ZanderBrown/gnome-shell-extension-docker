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
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const ModalDialog = imports.ui.modalDialog;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Docker = Me.imports.src.docker;

var DockerRemoveDialog = new Lang.Class({
    Name: 'DockerMenu.DockerRemoveDialog',
    Extends: ModalDialog.ModalDialog,

    _init(name) {
        this.parent();

        this._name = name;

        this.setButtons([{ label: _("Cancel"),
                           action: () => this.close(),
                           key:    Clutter.Escape
                         },
                         { label:  _("Remove"),
                           action: this._onRemoveButtonPressed.bind(this),
                           default: true
                         }]);

        let message = _("Remove container “%s”?").format(name);

        let box = new St.BoxLayout({ style_class: 'message-dialog-main-layout',
                                     vertical: false });
        this.contentLayout.add(box);

        let label = new St.Label({ style_class: 'message-dialog-title headline',
                                   text: message });
        box.add(label);
    },
 
    _onRemoveButtonPressed(button, event) {
        let dockerCmd = 'docker rm ' + this._name;
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
                let msg = "`" + res['cmd'] + "` " + _("terminated successfully");
                log(msg);
            } else {
                let errMsg = _("Error occurred when running") + " `" + res['cmd'] + "`";
                Main.notify(errMsg);
                log(errMsg);
                log(res['err']);
            }
        });
        this.close();
    }
});
