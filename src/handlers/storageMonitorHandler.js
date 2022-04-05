const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    handler: async function (rustplus, client) {
        let server = `${rustplus.server}-${rustplus.port}`;

        if (rustplus.storageMonitorIntervalCounter === 30) {
            rustplus.storageMonitorIntervalCounter = 0;
        }
        else {
            rustplus.storageMonitorIntervalCounter += 1;
            return;
        }

        let instance = client.readInstanceFile(rustplus.guildId);
        for (const [id, content] of Object.entries(instance.storageMonitors)) {
            if (content.type === 'toolcupboard' && content.ipPort === server) {
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(id);
                if (info.error && info.error === 'not_found') {
                    await DiscordTools.sendToolcupboardNotFound(rustplus.guildId, id);

                    delete instance.storageMonitors[id];

                    await client.storageMonitorsMessages[rustplus.guildId][id].delete();
                    delete client.storageMonitorsMessages[rustplus.guildId][id];

                    client.writeInstanceFile(rustplus.guildId, instance);
                    continue;
                }

                rustplus.storageMonitors[id] = {
                    items: info.entityInfo.payload.items,
                    expiry: info.entityInfo.payload.protectionExpiry
                }

                if (info.entityInfo.payload.protectionExpiry === 0 &&
                    instance.storageMonitors[id].decaying === false) {
                    instance.storageMonitors[id].decaying = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    await DiscordTools.sendDecayingNotification(rustplus.guildId, id);
                }
                else if (info.entityInfo.payload.protectionExpiry !== 0) {
                    instance.storageMonitors[id].decaying = false;
                    client.writeInstanceFile(rustplus.guildId, instance);
                }

                await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, id, true, false, false);
            }
        }
    },
}