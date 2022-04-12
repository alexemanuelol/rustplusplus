const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let server = `${rustplus.server}-${rustplus.port}`;

    if (!client.switchesMessages.hasOwnProperty(rustplus.guildId)) {
        client.switchesMessages[rustplus.guildId] = {};
    }

    if (!instance.serverList[server].hasOwnProperty('switchGroups')) {
        instance.serverList[server].switchGroups = {};
        client.writeInstanceFile(rustplus.guildId, instance);
    }

    for (const [groupName, content] of Object.entries(instance.serverList[server].switchGroups)) {
        if (server !== `${content.ipPort}`) continue;

        await DiscordTools.sendSmartSwitchGroupMessage(rustplus.guildId, groupName);
    }
};
