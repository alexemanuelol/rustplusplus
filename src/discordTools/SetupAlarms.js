const DiscordMessages = require('./discordMessages.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].alarms)) {
        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendSmartAlarmNotFoundMessage(rustplus.guildId, rustplus.serverId, key);
            instance.serverList[rustplus.serverId].alarms[key].reachable = false;
        }
        else {
            instance.serverList[rustplus.serverId].alarms[key].reachable = true;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        if (instance.serverList[rustplus.serverId].alarms[key].reachable) {
            if (instance.serverList[rustplus.serverId].alarms[key].active !== info.entityInfo.payload.value) {
                instance.serverList[rustplus.serverId].alarms[key].active = info.entityInfo.payload.value;
                client.writeInstanceFile(rustplus.guildId, instance);
            }
        }

        await DiscordMessages.sendSmartAlarmMessage(rustplus.guildId, rustplus.serverId, key);
    }
};
