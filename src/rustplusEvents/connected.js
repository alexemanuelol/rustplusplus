const PollingHandler = require('../handlers/pollingHandler.js');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('CONNECTED', 'RUSTPLUS CONNECTED');

        let server = `${rustplus.server}-${rustplus.port}`;
        let instance = client.readInstanceFile(rustplus.guildId);

        let channelIdActivity = instance.channelId.activity;
        let channelIdServers = instance.channelId.servers;
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, channelIdActivity);

        /* Get some map parameters once when connected (to avoid calling getMap continuously) */
        let map = await rustplus.getMapAsync(3 * 60 * 1000); /* 3 min timeout */
        if (!(await rustplus.isResponseValid(map))) {
            rustplus.log('ERROR', 'Something went wrong with connection.', 'error');

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
            return;
        }

        rustplus.log('CONNECTED', 'SUCCESSFULLY CONNECTED!');

        if (!rustplus.connected) {
            if (rustplus.isReconnect) {
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

            await DiscordTools.sendServerMessage(rustplus.guildId, server, null, false, true);

            rustplus.connected = true;
            rustplus.isReconnect = false;
        }

        rustplus.mapWidth = map.map.width;
        rustplus.mapHeight = map.map.height;
        rustplus.mapOceanMargin = map.map.oceanMargin;
        rustplus.mapMonuments = map.map.monuments;

        require('../discordTools/SetupSwitches')(client, rustplus);
        rustplus.loadMarkers();

        /* Run the first time before starting the interval */
        PollingHandler.pollingHandler(rustplus, client);

        /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
        rustplus.intervalId = setInterval(PollingHandler.pollingHandler,
            client.pollingIntervalMs,
            rustplus,
            client);
    },
};
