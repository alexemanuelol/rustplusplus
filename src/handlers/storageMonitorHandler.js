const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
        if (rustplus.storageMonitorIntervalCounter === 29) {
            rustplus.storageMonitorIntervalCounter = 0;
        }
        else {
            rustplus.storageMonitorIntervalCounter += 1;
            return;
        }

        let instance = client.readInstanceFile(rustplus.guildId);
        for (const [id, content] of Object.entries(instance.serverList[rustplus.serverId].storageMonitors)) {
            instance = client.readInstanceFile(rustplus.guildId);

            let info = await rustplus.getEntityInfoAsync(id);
            if (!(await rustplus.isResponseValid(info))) {
                if (instance.serverList[rustplus.serverId].storageMonitors[id].reachable) {
                    await DiscordMessages.sendStorageMonitorNotFoundMessage(rustplus.guildId, rustplus.serverId, id);
                }
                instance.serverList[rustplus.serverId].storageMonitors[id].reachable = false;
                client.writeInstanceFile(rustplus.guildId, instance);
            }
            else {
                instance.serverList[rustplus.serverId].storageMonitors[id].reachable = true;
                client.writeInstanceFile(rustplus.guildId, instance);
            }

            if (instance.serverList[rustplus.serverId].storageMonitors[id].reachable) {
                if (rustplus.storageMonitors.hasOwnProperty(id) && (rustplus.storageMonitors[id].capacity !== 0 &&
                    info.entityInfo.payload.capacity === 0)) {
                    await DiscordMessages.sendStorageMonitorDisconnectNotificationMessage(
                        rustplus.guildId, rustplus.serverId, id);
                }

                rustplus.storageMonitors[id] = {
                    items: info.entityInfo.payload.items,
                    expiry: info.entityInfo.payload.protectionExpiry,
                    capacity: info.entityInfo.payload.capacity,
                    hasProtection: info.entityInfo.payload.hasProtection
                }

                if (info.entityInfo.payload.capacity !== 0) {
                    if (info.entityInfo.payload.capacity === 28) {
                        instance.serverList[rustplus.serverId].storageMonitors[id].type = 'toolcupboard';
                        if (info.entityInfo.payload.protectionExpiry === 0 &&
                            instance.serverList[rustplus.serverId].storageMonitors[id].decaying === false) {
                            instance.serverList[rustplus.serverId].storageMonitors[id].decaying = true;

                            await DiscordMessages.sendDecayingNotificationMessage(
                                rustplus.guildId, rustplus.serverId, id);

                            if (instance.serverList[rustplus.serverId].storageMonitors[id].inGame) {
                                rustplus.sendTeamMessageAsync(
                                    `${instance.serverList[rustplus.serverId].storageMonitors[id].name} is decaying!`);
                            }
                        }
                        else if (info.entityInfo.payload.protectionExpiry !== 0) {
                            instance.serverList[rustplus.serverId].storageMonitors[id].decaying = false;
                        }
                    }
                    else {
                        instance.serverList[rustplus.serverId].storageMonitors[id].type = 'container';
                    }
                    client.writeInstanceFile(rustplus.guildId, instance);
                }
            }

            await DiscordMessages.sendStorageMonitorMessage(rustplus.guildId, rustplus.serverId, id);
        }
    },
}