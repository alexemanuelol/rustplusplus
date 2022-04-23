const PollingHandler = require('../handlers/pollingHandler.js');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');

const Map = require('../structures/Map');
const Info = require('../structures/Info');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('CONNECTED', 'RUSTPLUS CONNECTED');

        rustplus.tokens_replenish_task = setInterval(rustplus.replenish_tokens.bind(rustplus), 1000);

        let instance = client.readInstanceFile(rustplus.guildId);
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.activity);

        /* Get some map parameters once when connected (to avoid calling getMap continuously) */
        let map = await rustplus.getMapAsync(3 * 60 * 1000); /* 3 min timeout */
        if (!(await rustplus.isResponseValid(map))) {
            rustplus.log('ERROR', 'Something went wrong with connection.', 'error');

            if (channel !== undefined) {
                await client.messageSend(channel, {
                    embeds: [new MessageEmbed()
                        .setColor('#ff0040')
                        .setTitle('The connection to the server seems to be invalid. Try to re-pair to the server.')
                        .setThumbnail(instance.serverList[rustplus.serverId].img)
                        .setTimestamp()
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })
                    ]
                });
            }

            instance.serverList[rustplus.serverId].active = false;
            client.writeInstanceFile(rustplus.guildId, instance);

            await DiscordTools.sendServerMessage(rustplus.guildId, rustplus.serverId, null, false, true);

            rustplus.disconnect();
            delete client.rustplusInstances[rustplus.guildId];
            return;
        }

        if (rustplus.map === null) {
            rustplus.map = new Map(map.map, rustplus);
            rustplus.info = new Info((await rustplus.getInfoAsync()).info);
        }

        let isWipe = false;
        if (rustplus.map.isJpgImageChanged(map.map)) {
            isWipe = true;
        }

        await rustplus.map.updateMap(map.map);
        rustplus.info = new Info((await rustplus.getInfoAsync()).info);

        await rustplus.map.writeMap(false, true);

        let messageId = instance.informationMessageId.map;
        let message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, instance.channelId.information, messageId);
        }

        let mapFile = new MessageAttachment(`src/resources/images/maps/${rustplus.guildId}_map_full.png`);
        if (message === undefined) {
            let infoChannel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.information);

            if (!infoChannel) {
                client.log('ERROR', 'Invalid guild or channel.', 'error');
            }
            else {
                instance = client.readInstanceFile(rustplus.guildId);

                let msg = await client.messageSend(infoChannel, { files: [mapFile] });
                instance.informationMessageId.map = msg.id;
                client.writeInstanceFile(rustplus.guildId, instance);
            }
        }
        else {
            await client.messageEdit(message, { files: [mapFile] });
        }

        if (isWipe) {
            if (channel !== undefined) {
                let file = new MessageAttachment(`src/resources/images/maps/${rustplus.guildId}_map_full.png`);
                await client.messageSend(channel, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setTitle('Wipe detected!')
                        .setImage(`attachment://${rustplus.guildId}_map_full.png`)
                        .setTimestamp()
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })
                    ],
                    files: [file]
                });
            }
        }

        rustplus.log('CONNECTED', 'SUCCESSFULLY CONNECTED!');

        if (!rustplus.connected) {
            if (rustplus.isReconnect) {
                if (channel !== undefined) {
                    await client.messageSend(channel, {
                        embeds: [new MessageEmbed()
                            .setColor('#00ff40')
                            .setTitle('Server just went online.')
                            .setThumbnail(instance.serverList[rustplus.serverId].img)
                            .setTimestamp()
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })
                        ]
                    });
                }
            }

            await DiscordTools.sendServerMessage(rustplus.guildId, rustplus.serverId, null, false, true);

            rustplus.connected = true;
            rustplus.isReconnect = false;
            rustplus.refusedConnectionRetry = false;
        }

        await require('../discordTools/SetupSwitches')(client, rustplus);
        await require('../discordTools/SetupSwitchGroups')(client, rustplus);
        await require('../discordTools/SetupAlarms')(client, rustplus);
        await require('../discordTools/SetupStorageMonitors')(client, rustplus);
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
