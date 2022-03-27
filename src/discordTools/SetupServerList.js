const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);

    await DiscordTools.clearTextChannel(guild.id, instance.channelId.servers, 100);

    for (const [key, value] of Object.entries(instance.serverList)) {
        await DiscordTools.sendServerMessage(guild.id, key);
    }
};
