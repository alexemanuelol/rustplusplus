
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require("discord.js");

module.exports = async function (rustplus, client, message) {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.teamchat);

    if (message.message.startsWith(rustplus.trademarkString)) {
        return;
    }

    if (channel !== undefined) {
        let embed = new MessageEmbed()
            .setColor(message.color)
            .setDescription(`**${message.name}**: ${message.message}`)

        await channel.send({ embeds: [embed] });
    }
}