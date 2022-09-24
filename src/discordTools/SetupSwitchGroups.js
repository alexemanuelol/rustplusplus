const DiscordMessages = require('./discordMessages.js');

module.exports = async (client, rustplus) => {
    const instance = client.getInstance(rustplus.guildId);

    for (const groupId in instance.serverList[rustplus.serverId].switchGroups) {
        await DiscordMessages.sendSmartSwitchGroupMessage(rustplus.guildId, rustplus.serverId, groupId);
    }
};
