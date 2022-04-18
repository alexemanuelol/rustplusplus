const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let serverId = `${rustplus.server}-${rustplus.port}`;

    if (!client.switchesMessages.hasOwnProperty(rustplus.guildId)) {
        client.switchesMessages[rustplus.guildId] = {};
    }

    if (!instance.serverList[serverId].hasOwnProperty('switchGroups')) {
        instance.serverList[serverId].switchGroups = {};
        client.writeInstanceFile(rustplus.guildId, instance);
    }

    for (const [groupName, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
        if (serverId !== `${content.ipPort}`) continue;

        await DiscordTools.sendSmartSwitchGroupMessage(rustplus.guildId, groupName);
    }
};
