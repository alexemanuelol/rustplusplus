const DiscordMessages = require('./discordMessages.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;

    for (const entityId in instance.serverList[serverId].alarms) {
        instance = client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const info = await rustplus.getEntityInfoAsync(entityId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendSmartAlarmNotFoundMessage(guildId, serverId, entityId);
            entity.reachable = false;
        }
        else {
            entity.reachable = true;
        }

        if (entity.reachable) {
            if (entity.active !== info.entityInfo.payload.value) {
                entity.active = info.entityInfo.payload.value;
            }
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
    }
};
