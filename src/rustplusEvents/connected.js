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

import { setupAlarms } from '../discordTools/setup-alarms';
import { setupSwitches } from '../discordTools/setup-switches';
import { setupStorageMonitors } from '../discordTools/setup-storage-monitors';
import { setupSwitchGroups } from '../discordTools/setup-switch-groups';
import * as discordMessages from '../discordTools/discord-messages';
const Info = require('../structures/Info');
const Map = require('../structures/Map');
const PollingHandler = require('../handlers/pollingHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisRustplusInstance();

        rustplus.info(`${client.intlGet(null, 'connectedCap')}: ${client.intlGet(null, 'connectedToServer')}`);

        const instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;

        rustplus.uptimeServer = new Date();

        /* Start the token replenish task */
        rustplus.tokensReplenishTaskId = setInterval(rustplus.replenishTokens.bind(rustplus), 1000);

        /* Request the map. Act as a check to see if connection is truly operational. */
        const map = await rustplus.getMapAsync(3 * 60 * 1000); /* 3 min timeout */
        if (!(await rustplus.isResponseValid(map))) {
            rustplus.error(client.intlGet(null, 'somethingWrongWithConnection'));

            instance.activeServer = null;
            client.setInstance(guildId, instance);

            await discordMessages.sendServerConnectionInvalidMessage(guildId, serverId);
            await discordMessages.sendServerMessage(guildId, serverId, null);

            client.resetRustplusVariables(guildId);

            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
            return;
        }
        rustplus.info(`${client.intlGet(null, 'connectedCap')}: ${client.intlGet(null, 'rustplusOperational')}`);

        const info = await rustplus.getInfoAsync();
        if (await rustplus.isResponseValid(info)) rustplus.sInfo = new Info(info.info)

        if (client.rustplusMaps.hasOwnProperty(guildId)) {
            if (client.isJpgImageChanged(guildId, map.map)) {
                rustplus.map = new Map(map.map, rustplus);

                await rustplus.map.writeMap(false, true);
                await discordMessages.sendServerWipeDetectedMessage(guildId, serverId);
                await discordMessages.sendInformationMapMessage(guildId);
            }
            else {
                rustplus.map = new Map(map.map, rustplus);

                await rustplus.map.writeMap(false, true);
                await discordMessages.sendInformationMapMessage(guildId);
            }
        }
        else {
            rustplus.map = new Map(map.map, rustplus);

            await rustplus.map.writeMap(false, true);
            await discordMessages.sendInformationMapMessage(guildId);
        }

        if (client.rustplusReconnecting[guildId]) {
            client.rustplusReconnecting[guildId] = false;

            if (client.rustplusReconnectTimers[guildId]) {
                clearTimeout(client.rustplusReconnectTimers[guildId]);
                client.rustplusReconnectTimers[guildId] = null;
            }

            await discordMessages.sendServerChangeStateMessage(guildId, serverId, 0);
        }

        await discordMessages.sendServerMessage(guildId, serverId, null);

        /* Setup Smart Devices */
        await setupSwitches(rustplus);
        await setupSwitchGroups(rustplus);
        await setupAlarms(rustplus);
        await setupStorageMonitors(rustplus);

        rustplus.isNewConnection = false;
        rustplus.loadMarkers();

        await PollingHandler.pollingHandler(rustplus, client);
        rustplus.pollingTaskId = setInterval(PollingHandler.pollingHandler, client.pollingIntervalMs, rustplus, client);
        rustplus.isOperational = true;

        rustplus.updateLeaderRustPlusLiteInstance();
    },
};
