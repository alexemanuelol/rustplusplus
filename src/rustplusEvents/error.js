const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        rustplus.log('ERROR', JSON.stringify(err), 'error');

        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            rustplus.log('ERROR', `Could not connect to: ${rustplus.server}:${rustplus.port}`, 'error');
        }
        else if (err.code === 'ENOTFOUND' && err.stscall === 'getaddrinfo') {

        }
        else if (err.code === 'ECONNREFUSED') {
            rustplus.log('ERROR', 'Connection refused.', 'error');

            let server = `${rustplus.server}-${rustplus.port}`;
            let instance = client.readInstanceFile(rustplus.guildId);

            let channelIdActivity = instance.channelId.activity;
            let channelIdServers = instance.channelId.servers;
            let channel = DiscordTools.getTextChannelById(rustplus.guildId, channelIdActivity);

            if (channel !== undefined) {
                await channel.send({
                    embeds: [new MessageEmbed()
                        .setColor('#ff0040')
                        .setTitle('The connection to the server seems to be invalid. Try to re-pair to the server.')
                        .setThumbnail(instance.serverList[server].img)
                        .setTimestamp()
                        .setFooter({
                            text: instance.serverList[server].title
                        })
                    ]
                });
            }

            let row = DiscordTools.getServerButtonsRow(server, 0, instance.serverList[server].url);
            let messageId = instance.serverList[server].messageId;
            let message = undefined;
            if (messageId !== null) {
                message = await DiscordTools.getMessageById(rustplus.guildId, channelIdServers, messageId);
            }

            if (message !== undefined) {
                await message.edit({ components: [row] });
            }

            instance.serverList[server].active = false;
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.disconnect();
            delete client.rustplusInstances[rustplus.guildId];
        }
    },
};