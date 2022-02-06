
const Client = require('../../index.js');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require("discord.js");

module.exports = function (rustplus, client, message) {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.teamchat);
    if (message.message.startsWith(rustplus.trademarkString)) return;
    if (channel !== undefined) {
        let embed = new MessageEmbed()
            .setColor(message.color)
            .setTitle(message.name)
            .setDescription(message.message)
            .setFooter({
                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
            })
            .setTimestamp();

        channel.send({ embeds: [embed] });
    }
}