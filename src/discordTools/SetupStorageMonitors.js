const DiscordMessages = require('./discordMessages.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.getInstance(rustplus.guildId);
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;

    if (rustplus.isNewConnection) {
        await DiscordTools.clearTextChannel(guildId, instance.channelId.storageMonitors, 100);
    }

    for (const entityId in instance.serverList[serverId].storageMonitors) {
        instance = client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const info = await rustplus.getEntityInfoAsync(entityId);


        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendStorageMonitorNotFoundMessage(guildId, serverId, entityId);
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
                if (info.entityInfo.payload.capacity === 28) {
                    entity.type = 'toolcupboard';
                    if (info.entityInfo.payload.protectionExpiry === 0) {
                        entity.decaying = true;
                    }
                    else {
                        entity.decaying = false;
                    }
                }
                else {
                    entity.type = 'container';
                }
                client.setInstance(guildId, instance);
            }
        }

        await DiscordMessages.sendStorageMonitorMessage(guildId, serverId, entityId);
    }
};
