const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);

    await DiscordTools.clearTextChannel(guild.id, instance.channelId.trackers, 100);

    for (const [key, value] of Object.entries(instance.trackers)) {
        await DiscordTools.sendTrackerMessage(guild.id, key);
    }
}