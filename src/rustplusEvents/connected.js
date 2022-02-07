const PollingHandler = require('../handlers/continuousPollingHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('CONNECTED', 'RUSTPLUS CONNECTED');

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

            /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
            rustplus.intervalId = setInterval(PollingHandler.continuousPollingHandler,
                client.pollingIntervalMs,
                rustplus,
                client);
        });
    },
};
