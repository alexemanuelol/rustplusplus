const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let server = `${rustplus.server}-${rustplus.port}`;

    client.storageMonitorsMessages[rustplus.guildId] = {};

    await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);

    for (const [key, value] of Object.entries(instance.storageMonitors)) {
        if (server !== `${value.ipPort}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (info.error) {
            delete instance.storageMonitors[key];
            client.writeInstanceFile(rustplus.guildId, instance);
            continue;
        }

        rustplus.storageMonitors[key] = {
            items: info.entityInfo.payload.items,
            expiry: info.entityInfo.payload.protectionExpiry
        }

        if (info.entityInfo.payload.protectionExpiry === 0) {
            instance.storageMonitors[key].decaying = true;
        }
        else {
            instance.storageMonitors[key].decaying = false;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        DiscordTools.sendStorageMonitorMessage(rustplus.guildId, key);
    }
};
