const DiscordMessages = require('./discordMessages.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    const instance = client.getInstance(guild.id);

    await DiscordTools.clearTextChannel(guild.id, instance.channelId.trackers, 100);

    for (const trackerId in instance.trackers) {
        await DiscordMessages.sendTrackerMessage(guild.id, trackerId);
    }
}