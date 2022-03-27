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
            let instance = client.readInstanceFile(rustplus.guildId);

            rustplus.refusedConnectionRetry = true;

            if (rustplus.connected || rustplus.firstTime) {
                let channelIdActivity = instance.channelId.activity;
                let channel = DiscordTools.getTextChannelById(rustplus.guildId, channelIdActivity);
                if (channel !== undefined) {
                    await channel.send({
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setTitle('Server just went offline.')
                            .setThumbnail(instance.serverList[server].img)
                            .setTimestamp()
                            .setFooter({
                                text: instance.serverList[server].title
                            })
                        ]
                    });
                }

                await DiscordTools.sendServerMessage(rustplus.guildId, server, 2, false, true);

                rustplus.firstTime = false;
                rustplus.connected = false;
                rustplus.isReconnect = true;
            }

            setTimeout(() => {
                rustplus.log('RECONNECTING', 'RUSTPLUS RECONNECTING');
                rustplus.connect();
            }, 20000);
        }
        else if (err.toString() === 'Error: WebSocket was closed before the connection was established') {
            rustplus.log('ERROR', 'WebSocket was closed before the connection was established.', 'error');
        }
        else {
            rustplus.log('ERROR', err, 'error');
        }
    },
};