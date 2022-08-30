const DiscordMessages = require('./discordMessages.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    if (!instance.serverList[rustplus.serverId].hasOwnProperty('switchGroups')) {
        instance.serverList[rustplus.serverId].switchGroups = {};
        client.writeInstanceFile(rustplus.guildId, instance);
    }

    for (const [groupName, content] of Object.entries(instance.serverList[rustplus.serverId].switchGroups)) {
        if (rustplus.serverId !== `${content.serverId}`) continue;

        await DiscordMessages.sendSmartSwitchGroupMessage(rustplus.guildId, groupName);
    }
};
