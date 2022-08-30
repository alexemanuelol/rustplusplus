const Discord = require('discord.js');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Info = require('../structures/Info');
const Map = require('../structures/Map');
const PollingHandler = require('../handlers/pollingHandler.js');

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
                    embeds: [DiscordEmbeds.getEmbed({
                        color: '#ff0040',
                        title: 'The connection to the server seems to be invalid. Try to re-pair to the server.',
                        thumbnail: instance.serverList[rustplus.serverId].img,
                        timestamp: true,
                        footer: { text: instance.serverList[rustplus.serverId].title }
                    })]
                });
            }

            instance.serverList[rustplus.serverId].active = false;
            client.writeInstanceFile(rustplus.guildId, instance);

            await DiscordMessages.sendServerMessage(rustplus.guildId, rustplus.serverId, null);

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

        let mapFile = new Discord.AttachmentBuilder(`src/resources/images/maps/${rustplus.guildId}_map_full.png`);
        if (message === undefined) {
            let infoChannel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.information);

            if (!infoChannel) {
                client.log('ERROR', 'Invalid guild or channel.', 'error');
            }
            else {
                instance = client.readInstanceFile(rustplus.guildId);

                let msg = await client.messageSend(infoChannel, { files: [mapFile] });
                if (msg) {
                    instance.informationMessageId.map = msg.id;
                    client.writeInstanceFile(rustplus.guildId, instance);
                }
            }
        }
        else {
            await client.messageEdit(message, { files: [mapFile] });
        }

        if (isWipe) {
            if (channel !== undefined) {
                let file = new Discord.AttachmentBuilder(`src/resources/images/maps/${rustplus.guildId}_map_full.png`);
                await client.messageSend(channel, {
                    embeds: [DiscordEmbeds.getEmbed({
                        color: '#ce412b',
                        title: 'Wipe detected!',
                        image: `attachment://${rustplus.guildId}_map_full.png`,
                        timestamp: true,
                        footer: { text: instance.serverList[rustplus.serverId].title }
                    })],
                    files: [file]
                });
            }
        }

        rustplus.log('CONNECTED', 'SUCCESSFULLY CONNECTED!');

        if (!rustplus.connected) {
            if (rustplus.isReconnect) {
                if (channel !== undefined) {
                    await client.messageSend(channel, {
                        embeds: [DiscordEmbeds.getEmbed({
                            color: '#00ff40',
                            title: 'Server just went online.',
                            thumbnail: instance.serverList[rustplus.serverId].img,
                            timestamp: true,
                            footer: { text: instance.serverList[rustplus.serverId].title }
                        })]
                    });
                }
            }

            await DiscordMessages.sendServerMessage(rustplus.guildId, rustplus.serverId, null);

            rustplus.connected = true;
            rustplus.isReconnect = false;
            rustplus.refusedConnectionRetry = false;
        }

        await require('../discordTools/SetupSwitches')(client, rustplus, rustplus.newConnection);
        await require('../discordTools/SetupSwitchGroups')(client, rustplus);
        await require('../discordTools/SetupAlarms')(client, rustplus);
        await require('../discordTools/SetupStorageMonitors')(client, rustplus, rustplus.newConnection);
        rustplus.newConnection = false;
        rustplus.loadMarkers();

        /* Run the first time before starting the interval */
        PollingHandler.pollingHandler(rustplus, client);

        rustplus.ready = true;

        /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
        rustplus.intervalId = setInterval(PollingHandler.pollingHandler,
            client.pollingIntervalMs,
            rustplus,
            client);
    },
};
