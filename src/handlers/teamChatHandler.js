const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async function (rustplus, client, message) {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.teamchat);

    if (channel !== undefined) {
        const embed = DiscordEmbeds.getEmbed({
            color: message.color,
            description: `**${message.name}**: ${message.message}`
        });

        await client.messageSend(channel, { embeds: [embed] });
    }
}