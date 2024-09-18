/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const InstanceUtils = require('../util/instanceUtils.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(client, member) {
        const guildId = member.guild.id;
        const userId = member.user.id;

        const credentials = InstanceUtils.readCredentialsFile(guildId);

        const steamId = Object.keys(credentials).find(e => credentials[e] && credentials[e].discord_user_id === userId);

        if (!(steamId in credentials)) return;

        if (steamId === credentials.hoster) {
            if (client.fcmListeners[guildId]) {
                client.fcmListeners[guildId].destroy();
            }
            delete client.fcmListeners[guildId];
            credentials.hoster = null;
        }
        else {
            if (client.fcmListenersLite[guildId][steamId]) {
                client.fcmListenersLite[guildId][steamId].destroy();
            }
            delete client.fcmListenersLite[guildId][steamId];
        }

        delete credentials[steamId];
        InstanceUtils.writeCredentialsFile(guildId, credentials);
    },
}