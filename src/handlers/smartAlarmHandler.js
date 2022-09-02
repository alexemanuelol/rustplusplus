const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
        if (rustplus.smartAlarmIntervalCounter === 29) {
            rustplus.smartAlarmIntervalCounter = 0;
            let instance = client.readInstanceFile(rustplus.guildId);
            for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].alarms)) {
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.serverList[rustplus.serverId].alarms[key].reachable) {
                        await DiscordMessages.sendSmartAlarmNotFoundMessage(rustplus.guildId, rustplus.serverId, key);

                        instance.serverList[rustplus.serverId].alarms[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(rustplus.guildId, rustplus.serverId, key);
                    }
                }
                else {
                    if (!instance.serverList[rustplus.serverId].alarms[key].reachable) {
                        instance.serverList[rustplus.serverId].alarms[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(rustplus.guildId, rustplus.serverId, key);
                    }
                }
            }
        }
        else {
            rustplus.smartAlarmIntervalCounter += 1;
        }
    },
}