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

import { client, localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import { setupAlarms } from '../discordTools/setup-alarms';
import { setupSwitches } from '../discordTools/setup-switches';
import { setupStorageMonitors } from '../discordTools/setup-storage-monitors';
import { setupSwitchGroups } from '../discordTools/setup-switch-groups';
import { pollingHandler } from '../handlers/polling-handler';
import * as discordMessages from '../discordTools/discord-messages';
const { RustPlus } = require('../structures/RustPlus');
const Config = require('../../config');
const Info = require('../structures/Info');
const Map = require('../structures/Map');

export const name = 'connected';

export async function execute(rustplus: typeof RustPlus) {
    if (!rustplus.isServerAvailable()) return rustplus.deleteThisRustplusInstance();

    rustplus.info(`${lm.getIntl(Config.general.language, 'connectedCap')}: ${lm.getIntl(Config.general.language,
        'connectedToServer')}`);

    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;
    const instance = guildInstance.readGuildInstanceFile(guildId);

    rustplus.uptimeServer = new Date();

    /* Start the token replenish task */
    rustplus.tokensReplenishTaskId = setInterval(rustplus.replenishTokens.bind(rustplus), 1000);

    /* Request the map. Act as a check to see if connection is truly operational. */
    const map = await rustplus.getMapAsync(3 * 60 * 1000); /* 3 min timeout */
    if (!(await rustplus.isResponseValid(map))) {
        rustplus.error(lm.getIntl(Config.general.language, 'somethingWrongWithConnection'));

        instance.activeServer = null;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        await discordMessages.sendServerConnectionInvalidMessage(guildId, serverId);
        await discordMessages.sendServerMessage(guildId, serverId, null);

        client.resetRustplusVariables(guildId);

        rustplus.disconnect();
        delete client.rustplusInstances[guildId];
        return;
    }
    rustplus.info(`${lm.getIntl(Config.general.language, 'connectedCap')}: ${lm.getIntl(Config.general.language,
        'rustplusOperational')}`);

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

    await pollingHandler(rustplus);
    rustplus.pollingTaskId = setInterval(pollingHandler, client.pollingIntervalMs, rustplus);
    rustplus.isOperational = true;

    rustplus.updateLeaderRustPlusLiteInstance();
}