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
        for (const [id, content] of Object.entries(instance.storageMonitors)) {
            if (rustplus.serverId !== content.serverId) continue;
            instance = client.readInstanceFile(rustplus.guildId);

            let info = await rustplus.getEntityInfoAsync(id);
            if (!(await rustplus.isResponseValid(info))) {
                if (instance.storageMonitors[id].reachable) {
                    await DiscordMessages.sendStorageMonitorNotFoundMessage(rustplus.guildId, id);
                }
                instance.storageMonitors[id].reachable = false;
                client.writeInstanceFile(rustplus.guildId, instance);
            }
            else {
                instance.storageMonitors[id].reachable = true;
                client.writeInstanceFile(rustplus.guildId, instance);
            }

            if (instance.storageMonitors[id].reachable) {
                if (rustplus.storageMonitors.hasOwnProperty(id) && (rustplus.storageMonitors[id].capacity !== 0 &&
                    info.entityInfo.payload.capacity === 0)) {
                    await DiscordMessages.sendStorageMonitorDisconnectNotificationMessage(rustplus.guildId, id);
                }

                rustplus.storageMonitors[id] = {
                    items: info.entityInfo.payload.items,
                    expiry: info.entityInfo.payload.protectionExpiry,
                    capacity: info.entityInfo.payload.capacity,
                    hasProtection: info.entityInfo.payload.hasProtection
                }

                if (info.entityInfo.payload.capacity !== 0) {
                    if (info.entityInfo.payload.capacity === 28) {
                        instance.storageMonitors[id].type = 'toolcupboard';
                        if (info.entityInfo.payload.protectionExpiry === 0 &&
                            instance.storageMonitors[id].decaying === false) {
                            instance.storageMonitors[id].decaying = true;

                            await DiscordMessages.sendDecayingNotificationMessage(rustplus.guildId, id);

                            if (instance.storageMonitors[id].inGame) {
                                rustplus.sendTeamMessageAsync(`${instance.storageMonitors[id].name} is decaying!`);
                            }
                        }
                        else if (info.entityInfo.payload.protectionExpiry !== 0) {
                            instance.storageMonitors[id].decaying = false;
                        }
                    }
                    else {
                        instance.storageMonitors[id].type = 'container';
                    }
                    client.writeInstanceFile(rustplus.guildId, instance);
                }
            }

            await DiscordMessages.sendStorageMonitorMessage(rustplus.guildId, id);
        }
    },
}