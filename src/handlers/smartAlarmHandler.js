const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
        if (rustplus.smartAlarmIntervalCounter === 29) {
            rustplus.smartAlarmIntervalCounter = 0;
            let instance = client.readInstanceFile(rustplus.guildId);
            for (const [key, value] of Object.entries(instance.alarms)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.alarms[key].reachable) {
                        await DiscordMessages.sendSmartAlarmNotFound(rustplus.guildId, key);

                        instance.alarms[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(rustplus.guildId, key);
                    }
                }
                else {
                    if (!instance.alarms[key].reachable) {
                        instance.alarms[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(rustplus.guildId, key);
                    }
                }
            }
        }
        else {
            rustplus.smartAlarmIntervalCounter += 1;
        }
    },
}