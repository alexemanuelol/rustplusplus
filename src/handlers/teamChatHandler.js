
const Discord = require("discord.js");

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async function (rustplus, client, message) {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.teamchat);

    if (channel !== undefined) {
        let embed = new Discord.EmbedBuilder()
            .setColor(message.color)
            .setDescription(`**${message.name}**: ${message.message}`)

        await client.messageSend(channel, { embeds: [embed] });
    }
}