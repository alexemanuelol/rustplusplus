const DiscordMessages = require('./discordMessages.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus, newConnection = false) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    if (newConnection) {
        await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);
    }

    for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].storageMonitors)) {
        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendStorageMonitorNotFoundMessage(rustplus.guildId, rustplus.serverId, key);
            instance.serverList[rustplus.serverId].storageMonitors[key].reachable = false;
        }
        else {
            instance.serverList[rustplus.serverId].storageMonitors[key].reachable = true;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        if (instance.serverList[rustplus.serverId].storageMonitors[key].reachable) {
            rustplus.storageMonitors[key] = {
                items: info.entityInfo.payload.items,
                expiry: info.entityInfo.payload.protectionExpiry,
                capacity: info.entityInfo.payload.capacity,
                hasProtection: info.entityInfo.payload.hasProtection
            }

            if (info.entityInfo.payload.capacity !== 0) {
                if (info.entityInfo.payload.capacity === 28) {
                    instance.serverList[rustplus.serverId].storageMonitors[key].type = 'toolcupboard';
                    if (info.entityInfo.payload.protectionExpiry === 0) {
                        instance.serverList[rustplus.serverId].storageMonitors[key].decaying = true;
                    }
                    else {
                        instance.serverList[rustplus.serverId].storageMonitors[key].decaying = false;
                    }
                }
                else {
                    instance.serverList[rustplus.serverId].storageMonitors[key].type = 'container';
                }
                client.writeInstanceFile(rustplus.guildId, instance);
            }
        }

        await DiscordMessages.sendStorageMonitorMessage(rustplus.guildId, rustplus.serverId, key);
    }
};
