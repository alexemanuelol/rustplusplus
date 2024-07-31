/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import { client } from '../../index';
import * as constants from '../util/constants';
import * as discordTools from './discord-tools';
const DiscordMessages = require('./discordMessages.js');
const { RustPlus } = require('../structures/RustPlus.js');

export async function setupStorageMonitors(rustplus: typeof RustPlus) {
    const guildId = rustplus.guildId;
    const instance = client.getInstance(guildId);
    const serverId = rustplus.serverId;

    if (rustplus.isNewConnection) {
        await discordTools.clearTextChannel(guildId, instance.channelIds.storageMonitors, 100);
    }

    for (const entityId in instance.serverList[serverId].storageMonitors) {
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const info = await rustplus.getEntityInfoAsync(entityId);

        if (!(await rustplus.isResponseValid(info))) {
            if (entity.reachable === true) {
                await DiscordMessages.sendStorageMonitorNotFoundMessage(guildId, serverId, entityId);
            }
            entity.reachable = false;
        }
        else {
            entity.reachable = true;
        }
        client.setInstance(guildId, instance);

        if (entity.reachable) {
            rustplus.storageMonitors[entityId] = {
                items: info.entityInfo.payload.items,
                expiry: info.entityInfo.payload.protectionExpiry,
                capacity: info.entityInfo.payload.capacity,
                hasProtection: info.entityInfo.payload.hasProtection
            }

            if (info.entityInfo.payload.capacity !== 0) {
                if (info.entityInfo.payload.capacity === constants.STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY) {
                    entity.type = 'toolCupboard';
                    if (info.entityInfo.payload.protectionExpiry === 0) {
                        entity.decaying = true;
                    }
                    else {
                        entity.decaying = false;
                    }
                }
                else if (info.entityInfo.payload.capacity === constants.STORAGE_MONITOR_VENDING_MACHINE_CAPACITY) {
                    entity.type = 'vendingMachine';
                }
                else if (info.entityInfo.payload.capacity === constants.STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY) {
                    entity.type = 'largeWoodBox';
                }
                client.setInstance(guildId, instance);
            }
        }

        await DiscordMessages.sendStorageMonitorMessage(guildId, serverId, entityId);
    }
}