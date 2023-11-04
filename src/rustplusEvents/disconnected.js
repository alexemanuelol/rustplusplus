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

const DiscordMessages = require('../discordTools/discordMessages.js');

const Config = require('../../config');

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable() && !rustplus.isDeleted) {
            rustplus.deleteThisRustplusInstance();
        }

        rustplus.log(client.intlGet(null, 'disconnectedCap'), client.intlGet(null, 'disconnectedFromServer'));

        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;

        if (rustplus.leaderRustPlusInstance !== null) {
            if (client.rustplusLiteReconnectTimers[guildId]) {
                clearTimeout(client.rustplusLiteReconnectTimers[guildId]);
                client.rustplusLiteReconnectTimers[guildId] = null;
            }
            rustplus.leaderRustPlusInstance.isActive = false;
            rustplus.leaderRustPlusInstance.disconnect();
            rustplus.leaderRustPlusInstance = null;
        }

        /* Stop current tasks */
        clearInterval(rustplus.pollingTaskId);
        clearInterval(rustplus.tokensReplenishTaskId);
        clearTimeout(rustplus.inGameChatTimeout);

        /* Reset map markers, timers & arrays */
        if (rustplus.mapMarkers) rustplus.mapMarkers.reset();

        /* Stop all custom timers */
        for (const [id, timer] of Object.entries(rustplus.timers)) timer.timer.stop();

        if (rustplus.isDeleted) return;

        /* Was the disconnection unexpected? */
        if (client.activeRustplusInstances[guildId]) {
            if (!client.rustplusReconnecting[guildId]) {
                await DiscordMessages.sendServerChangeStateMessage(guildId, serverId, 1);
                await DiscordMessages.sendServerMessage(guildId, serverId, 2);
            }

            client.rustplusReconnecting[guildId] = true;

            rustplus.log(client.intlGet(null, 'reconnectingCap'), client.intlGet(null, 'reconnectingToServer'));

            delete client.rustplusInstances[guildId];

            if (client.rustplusReconnectTimers[guildId]) {
                clearTimeout(client.rustplusReconnectTimers[guildId]);
                client.rustplusReconnectTimers[guildId] = null;
            }

            client.rustplusReconnectTimers[guildId] = setTimeout(
                client.createRustplusInstance.bind(client),
                Config.general.reconnectIntervalMs,
                guildId,
                rustplus.server,
                rustplus.port,
                rustplus.playerId,
                rustplus.playerToken
            );
        }
    },
};