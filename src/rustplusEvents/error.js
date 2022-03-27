const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            rustplus.log('ERROR', `Could not connect to: ${rustplus.server}:${rustplus.port}.`, 'error');
        }
        else if (err.code === 'ENOTFOUND' && err.stscall === 'getaddrinfo') {
            rustplus.log('ERROR', `Could not connect to: ${rustplus.server}:${rustplus.port}.`, 'error');
        }
        else if (err.code === 'ECONNREFUSED') {
            rustplus.log('ERROR', `Connection refused to: ${rustplus.server}:${rustplus.port}.`, 'error');

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

            instance.serverList[server].active = false;
            client.writeInstanceFile(rustplus.guildId, instance);

            await DiscordTools.sendServerMessage(rustplus.guildId, server, null, false, true);

            rustplus.disconnect();
            delete client.rustplusInstances[rustplus.guildId];
        }
        else if (err.toString() === 'Error: WebSocket was closed before the connection was established') {
            rustplus.log('ERROR', 'WebSocket was closed before the connection was established.', 'error');
        }
        else {
            rustplus.log('ERROR', err, 'error');
        }
    },
};