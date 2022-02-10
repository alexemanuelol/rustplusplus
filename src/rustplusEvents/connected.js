const PollingHandler = require('../handlers/continuousPollingHandler.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('CONNECTED', 'RUSTPLUS CONNECTED');

        let instance = client.readInstanceFile(rustplus.guildId);

        /* Get some map parameters once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            if (map.response.error) {
                rustplus.log('ERROR', 'Something went wrong with connection', 'error');
                rustplus.disconnect();
                return;
            }
            rustplus.log('CONNECTED', 'SUCCESSFULLY CONNECTED!');

            rustplus.mapWidth = map.response.map.width;
            rustplus.mapHeight = map.response.map.height;
            rustplus.mapOceanMargin = map.response.map.oceanMargin;
            rustplus.mapMonuments = map.response.map.monuments;

            client.informationMessages[rustplus.guildId] = {};
            DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.information, 100);

            /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
            rustplus.intervalId = setInterval(PollingHandler.continuousPollingHandler,
                client.pollingIntervalMs,
                rustplus,
                client);
        });
    },
};
