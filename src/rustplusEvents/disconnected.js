const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log('DISCONNECTED', 'DISCONNECTED FROM SERVER.');
        rustplus.isConnected = false;
        rustplus.isOperational = false;
        rustplus.isFirstPoll = true;

        const instance = client.readInstanceFile(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const server = instance.serverList[serverId];

        /* Stop current tasks */
        clearInterval(rustplus.pollingTaskId);
        clearInterval(rustplus.tokensReplenishTaskId);

        /* Reset map markers, timers & arrays */
        if (rustplus.mapMarkers) rustplus.mapMarkers.reset();

        /* Stop all custom timers */
        for (const [id, timer] of Object.entries(rustplus.timers)) timer.timer.stop();
        rustplus.timers = new Object();

        /* Reset time variables */
        rustplus.passedFirstSunriseOrSunset = false;
        rustplus.startTimeObject = new Object();

        rustplus.markers = new Object();
        rustplus.informationIntervalCounter = 0;
        rustplus.interactionSwitches = [];

        if (rustplus.isDeleted) return;

        if (server.active && !rustplus.isConnectionRefused) {
            if (!rustplus.isReconnecting) {
                await DiscordMessages.sendServerChangeStateMessage(guildId, serverId, 1);
                await DiscordMessages.sendServerMessage(guildId, serverId, 2);
            }

            rustplus.isReconnecting = true;

            rustplus.log('RECONNECTING', 'RECONNECTING TO SERVER...');
            rustplus.connect();
        }
    },
};