const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let server = `${rustplus.server}-${rustplus.port}`;

    for (const [key, value] of Object.entries(instance.alarms)) {
        if (server !== `${value.ipPort}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            let messageId = instance.alarms[key].messageId;
            let message = await DiscordTools.getMessageById(rustplus.guildId, instance.channelId.alarms, messageId);
            if (message !== undefined) {
                await message.delete();
            }

            delete instance.alarms[key];
            client.writeInstanceFile(rustplus.guildId, instance);
            continue;
        }

        if (instance.alarms[key].active !== info.entityInfo.payload.value) {
            instance.alarms[key].active = info.entityInfo.payload.value;
            client.writeInstanceFile(rustplus.guildId, instance);

            await DiscordTools.sendSmartAlarmMessage(rustplus.guildId, key);
        }
    }
};
