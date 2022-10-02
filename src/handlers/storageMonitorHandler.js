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
                        if (info.entityInfo.payload.capacity === 28) {
                            instance.serverList[serverId].storageMonitors[entityId].type = 'toolcupboard';
                            if (info.entityInfo.payload.protectionExpiry === 0 &&
                                instance.serverList[serverId].storageMonitors[entityId].decaying === false) {
                                instance.serverList[serverId].storageMonitors[entityId].decaying = true;

                                await DiscordMessages.sendDecayingNotificationMessage(
                                    guildId, serverId, entityId);

                                if (instance.serverList[serverId].storageMonitors[entityId].inGame) {
                                    rustplus.sendTeamMessageAsync(client.intlGet(rustplus.guildId, 'isDecaying', {
                                        device: instance.serverList[serverId].storageMonitors[entityId].name
                                    }));
                                }
                            }
                            else if (info.entityInfo.payload.protectionExpiry !== 0) {
                                instance.serverList[serverId].storageMonitors[entityId].decaying = false;
                            }
                        }
                        else {
                            instance.serverList[serverId].storageMonitors[entityId].type = 'container';
                        }
                        client.setInstance(guildId, instance);
                    }
                }

                await DiscordMessages.sendStorageMonitorMessage(guildId, serverId, entityId);
            }
        }
    },
}