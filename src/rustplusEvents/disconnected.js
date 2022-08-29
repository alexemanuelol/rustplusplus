const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('DISCONNECTED', 'RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);
        clearInterval(rustplus.tokens_replenish_task);

        let instance = client.readInstanceFile(rustplus.guildId);

        rustplus.firstPoll = true;
        rustplus.ready = false;

        if (rustplus.mapMarkers) {
            rustplus.mapMarkers.reset();
        }

        for (const [id, timer] of Object.entries(rustplus.timers)) {
            timer.timer.stop();
        }
        rustplus.timers = new Object();

        /* Reset time variables */
        rustplus.passedFirstSunriseOrSunset = false;
        rustplus.startTimeObject = new Object();

        rustplus.markers = new Object();

        rustplus.informationIntervalCounter = 0;
        rustplus.interactionSwitches = [];

        if (rustplus.deleted) {
            return;
        }

        if (instance.serverList.hasOwnProperty(rustplus.serverId)) {
            if (instance.serverList[rustplus.serverId].active && !rustplus.refusedConnectionRetry) {
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

                rustplus.log('RECONNECTING', 'RUSTPLUS RECONNECTING');
                rustplus.connect();
            }
        }
    },
};