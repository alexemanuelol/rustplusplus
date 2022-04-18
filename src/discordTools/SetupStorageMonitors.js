const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    client.storageMonitorsMessages[rustplus.guildId] = {};

    await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);

    for (const [key, value] of Object.entries(instance.storageMonitors)) {
        if (rustplus.serverId !== `${value.serverId}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            delete instance.storageMonitors[key];
            client.writeInstanceFile(rustplus.guildId, instance);
            continue;
        }

        rustplus.storageMonitors[key] = {
            items: info.entityInfo.payload.items,
            expiry: info.entityInfo.payload.protectionExpiry,
            capacity: info.entityInfo.payload.capacity,
            hasProtection: info.entityInfo.payload.hasProtection
        }

        if (info.entityInfo.payload.capacity !== 0) {
            if (info.entityInfo.payload.capacity === 28) {
                instance.storageMonitors[key].type = 'toolcupboard';
                if (info.entityInfo.payload.protectionExpiry === 0) {
                    instance.storageMonitors[key].decaying = true;
                }
                else {
                    instance.storageMonitors[key].decaying = false;
                }
            }
            else {
                instance.storageMonitors[key].type = 'container';
            }
            client.writeInstanceFile(rustplus.guildId, instance);
        }

        await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, key);
    }
};
