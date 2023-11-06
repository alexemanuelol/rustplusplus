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

const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
        let instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;

        if (!instance.serverList.hasOwnProperty(serverId)) return;

        if (rustplus.storageMonitorIntervalCounter === 29) {
            rustplus.storageMonitorIntervalCounter = 0;
        }
        else {
            rustplus.storageMonitorIntervalCounter += 1;
        }

        if (rustplus.storageMonitorIntervalCounter === 0) {
            let instance = client.getInstance(guildId);
            for (const entityId in instance.serverList[serverId].storageMonitors) {
                instance = client.getInstance(guildId);

                const info = await rustplus.getEntityInfoAsync(entityId);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.serverList[serverId].storageMonitors[entityId].reachable) {
                        await DiscordMessages.sendStorageMonitorNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].storageMonitors[entityId].reachable = false;
                }
                else {
                    instance.serverList[serverId].storageMonitors[entityId].reachable = true;
                }
                client.setInstance(guildId, instance);

                if (instance.serverList[serverId].storageMonitors[entityId].reachable) {
                    if (rustplus.storageMonitors.hasOwnProperty(entityId) &&
                        (rustplus.storageMonitors[entityId].capacity !== 0 &&
                            info.entityInfo.payload.capacity === 0)) {
                        await DiscordMessages.sendStorageMonitorDisconnectNotificationMessage(
                            guildId, serverId, entityId);
                    }

                    rustplus.storageMonitors[entityId] = {
                        items: info.entityInfo.payload.items,
                        expiry: info.entityInfo.payload.protectionExpiry,
                        capacity: info.entityInfo.payload.capacity,
                        hasProtection: info.entityInfo.payload.hasProtection
                    }

                    if (info.entityInfo.payload.capacity !== 0) {
                        if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY) {
                            instance.serverList[serverId].storageMonitors[entityId].type = 'toolCupboard';
                            if (info.entityInfo.payload.protectionExpiry === 0 &&
                                instance.serverList[serverId].storageMonitors[entityId].decaying === false) {
                                instance.serverList[serverId].storageMonitors[entityId].decaying = true;

                                await DiscordMessages.sendDecayingNotificationMessage(
                                    guildId, serverId, entityId);

                                if (instance.serverList[serverId].storageMonitors[entityId].inGame) {
                                    rustplus.sendInGameMessage(client.intlGet(rustplus.guildId, 'isDecaying', {
                                        device: instance.serverList[serverId].storageMonitors[entityId].name
                                    }));
                                }
                            }
                            else if (info.entityInfo.payload.protectionExpiry !== 0) {
                                instance.serverList[serverId].storageMonitors[entityId].decaying = false;
                            }
                        }
                        else if (info.entityInfo.payload.capacity ===
                            Constants.STORAGE_MONITOR_VENDING_MACHINE_CAPACITY) {
                            instance.serverList[serverId].storageMonitors[entityId].type = 'vendingMachine';
                        }
                        else if (info.entityInfo.payload.capacity ===
                            Constants.STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY) {
                            instance.serverList[serverId].storageMonitors[entityId].type = 'largeWoodBox';
                        }
                        client.setInstance(guildId, instance);
                    }
                }

                await DiscordMessages.sendStorageMonitorMessage(guildId, serverId, entityId);
            }
        }
    },
}