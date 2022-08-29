const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');

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
                    await client.messageSend(channel, {
                        embeds: [DiscordEmbeds.getEmbed({
                            color: '#ff0040',
                            title: 'Server just went offline.',
                            thumbnail: instance.serverList[rustplus.serverId].img,
                            timestamp: true,
                            footer: { text: instance.serverList[rustplus.serverId].title }
                        })]
                    });
                }

                await DiscordMessages.sendServerMessage(rustplus.guildId, rustplus.serverId, 2);

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