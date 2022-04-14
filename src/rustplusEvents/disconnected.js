const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('DISCONNECTED', 'RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);
        clearInterval(rustplus.tokens_replenish_task);

        let server = `${rustplus.server}-${rustplus.port}`;
        let instance = client.readInstanceFile(rustplus.guildId);

        rustplus.firstPoll = true;

        rustplus.activeCargoShips = new Object();
        rustplus.activeChinook47s = new Object();
        rustplus.activeLockedCrates = new Object();
        rustplus.activePatrolHelicopters = new Object();
        rustplus.activeExplosions = new Object();
        rustplus.patrolHelicoptersLeft = [];
        rustplus.smallOilRigLockedCratesLeft = [];
        rustplus.largeOilRigLockedCratesLeft = [];
        rustplus.activeVendingMachines = [];
        rustplus.foundItems = [];
        rustplus.itemsToLookForId = [];

        /* Stop all timers */
        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            timer.stop();
        }
        rustplus.cargoShipEgressTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateSmallOilRigTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateSmallOilRigTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateLargeOilRigTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateLargeOilRigTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateDespawnTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateDespawnTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateDespawnWarningTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateDespawnWarningTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            timer.stop();
        }
        rustplus.bradleyRespawnTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.timers)) {
            timer.stop();
        }
        rustplus.timers = new Object();

        /* Reset dates */
        rustplus.timeSinceCargoWasOut = null;
        rustplus.timeSinceChinookWasOut = null;
        rustplus.timeSinceBradleyWasDestroyed = null;
        rustplus.timeSinceHeliWasDestroyed = null;
        rustplus.timeSinceHeliWasOnMap = null;
        rustplus.timeSinceSmallOilRigWasTriggered = null;
        rustplus.timeSinceLargeOilRigWasTriggered = null;
        rustplus.timeSinceChinookDroppedCrate = null;

        /* Reset time variables */
        rustplus.passedFirstSunriseOrSunset = false;
        rustplus.startTimeObject = new Object();

        rustplus.markers = new Object();

        rustplus.informationIntervalCounter = 0;
        rustplus.interactionSwitches = [];

        if (rustplus.deleted) {
            return;
        }

        if (instance.serverList.hasOwnProperty(`${rustplus.server}-${rustplus.port}`)) {
            if (instance.serverList[server].active && !rustplus.refusedConnectionRetry) {
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

                rustplus.log('RECONNECTING', 'RUSTPLUS RECONNECTING');
                rustplus.connect();
            }
        }
    },
};