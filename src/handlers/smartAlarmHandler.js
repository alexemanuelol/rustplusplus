const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
        let instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;

        if (!instance.serverList.hasOwnProperty(serverId)) return;

        if (rustplus.smartAlarmIntervalCounter === 29) {
            rustplus.smartAlarmIntervalCounter = 0;
        }
        else {
            rustplus.smartAlarmIntervalCounter += 1;
        }

        if (rustplus.smartAlarmIntervalCounter === 0) {
            for (const entityId in instance.serverList[serverId].alarms) {
                instance = client.getInstance(guildId);

                const info = await rustplus.getEntityInfoAsync(entityId);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.serverList[serverId].alarms[entityId].reachable) {
                        await DiscordMessages.sendSmartAlarmNotFoundMessage(guildId, serverId, entityId);

                        instance.serverList[serverId].alarms[entityId].reachable = false;
                        client.setInstance(guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
                    }
                }
                else {
                    if (!instance.serverList[serverId].alarms[entityId].reachable) {
                        instance.serverList[serverId].alarms[entityId].reachable = true;
                        client.setInstance(guildId, instance);

                        await DiscordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
                    }
                }
            }
        }
    },
}