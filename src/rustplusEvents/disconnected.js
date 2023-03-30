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

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log(client.intlGet(null, 'disconnectedCap'), client.intlGet(null, 'disconnectedFromServer'));
        rustplus.isConnected = false;
        rustplus.isOperational = false;
        rustplus.isFirstPoll = true;

        const instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const server = instance.serverList[serverId];

        if (rustplus.leaderRustPlusInstance !== null) {
            rustplus.leaderRustPlusInstance.isActive = false;
            rustplus.leaderRustPlusInstance.disconnect();
            rustplus.leaderRustPlusInstance = null;
        }

        /* Stop current tasks */
        clearInterval(rustplus.pollingTaskId);
        clearInterval(rustplus.tokensReplenishTaskId);

        /* Reset map markers, timers & arrays */
        if (rustplus.mapMarkers) rustplus.mapMarkers.reset();

        /* Stop all custom timers */
        for (const [id, timer] of Object.entries(rustplus.timers)) timer.timer.stop();
        rustplus.timers = new Object();

        /* Reset time variables */
        rustplus.passedFirstSunriseOrSunset = false;
        rustplus.startTimeObject = new Object();

        rustplus.markers = new Object();
        rustplus.informationIntervalCounter = 0;
        rustplus.interactionSwitches = [];

        if (rustplus.isDeleted) return;

        if (server.active && !rustplus.isConnectionRefused) {
            if (!rustplus.isReconnecting) {
                await DiscordMessages.sendServerChangeStateMessage(guildId, serverId, 1);
                await DiscordMessages.sendServerMessage(guildId, serverId, 2);
            }

            rustplus.isReconnecting = true;

            rustplus.log(client.intlGet(null, 'reconnectingCap'), client.intlGet(null, 'reconnectingToServer'));
            rustplus.connect();
        }
    },
};