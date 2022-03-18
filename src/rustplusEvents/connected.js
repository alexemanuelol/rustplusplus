const PollingHandler = require('../handlers/pollingHandler.js');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('CONNECTED', 'RUSTPLUS CONNECTED');

        let server = `${rustplus.server}-${rustplus.port}`;
        let instance = client.readInstanceFile(rustplus.guildId);

        /* Get some map parameters once when connected (to avoid calling getMap continuously) */
        rustplus.getMap(async (map) => {
            if (!rustplus.isResponseValid(map)) {
                rustplus.log('ERROR', 'Something went wrong with connection', 'error');
                rustplus.disconnect();
                return;
            }

            rustplus.log('CONNECTED', 'SUCCESSFULLY CONNECTED!');

            if (!rustplus.connected) {
                if (rustplus.isReconnect) {
                    let channelIdActivity = instance.channelId.activity;
                    let channel = DiscordTools.getTextChannelById(rustplus.guildId, channelIdActivity);
                    if (channel !== undefined) {
                        await channel.send({
                            embeds: [new MessageEmbed()
                                .setColor('#00ff40')
                                .setTitle('Server just went online.')
                                .setThumbnail(instance.serverList[server].img)
                                .setTimestamp()
                                .setFooter({
                                    text: instance.serverList[server].title
                                })
                            ]
                        });
                    }
                }

                let row = DiscordTools.getServerButtonsRow(server, 1, instance.serverList[server].url);

                let channelIdServers = instance.channelId.servers;
                let messageId = instance.serverList[server].messageId;
                let message = undefined;
                if (messageId !== null) {
                    message = await DiscordTools.getMessageById(rustplus.guildId, channelIdServers, messageId);
                }

                if (message !== undefined) {
                    await message.edit({ components: [row] });
                }

                rustplus.connected = true;
                rustplus.isReconnect = false;
            }

            rustplus.mapWidth = map.response.map.width;
            rustplus.mapHeight = map.response.map.height;
            rustplus.mapOceanMargin = map.response.map.oceanMargin;
            rustplus.mapMonuments = map.response.map.monuments;

            require('../discordTools/SetupSwitches')(client, rustplus);
            rustplus.loadMarkers();

            /* Run the first time before starting the interval */
            PollingHandler.pollingHandler(rustplus, client);

            /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
            rustplus.intervalId = setInterval(PollingHandler.pollingHandler,
                client.pollingIntervalMs,
                rustplus,
                client);
        });
    },
};
