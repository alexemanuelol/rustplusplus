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

        //const credentials = InstanceUtils.readCredentialsFile(guildId);
        const authTokens = InstanceUtils.readAuthTokensFile(guildId);

        //const steamId = Object.keys(credentials).find(e => credentials[e] && credentials[e].discordUserId === userId);
        const steamId = Object.keys(authTokens).find(e => authTokens[e] && authTokens[e].discordUserId === userId);

        //if (!(steamId in credentials)) return;
        if (!(steamId in authTokens)) return;

        //if (steamId === credentials.hoster) {
        //    if (client.fcmListeners[guildId]) {
        //        client.fcmListeners[guildId].destroy();
        //    }
        //    delete client.fcmListeners[guildId];
        //    credentials.hoster = null;
        //}
        //else {
        //    if (client.fcmListenersLite[guildId][steamId]) {
        //        client.fcmListenersLite[guildId][steamId].destroy();
        //    }
        //    delete client.fcmListenersLite[guildId][steamId];
        //}

        if (client.authTokenListenerIntervalsIds[guildId] &&
            client.authTokenListenerIntervalsIds[guildId][steamId]) {
            clearInterval(client.authTokenListenerIntervalsIds[guildId][steamId]);
            delete client.authTokenListenerIntervalsIds[guildId][steamId];
        }

        if (steamId === authTokens.hoster) {
            authTokens.hoster = null;
        }

        //delete credentials[steamId];
        delete authTokens[steamId];
        //InstanceUtils.writeCredentialsFile(guildId, credentials);
        InstanceUtils.writeAuthTokensFile(guildId, authTokens);
    },
}
