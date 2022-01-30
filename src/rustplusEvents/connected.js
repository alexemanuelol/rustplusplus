const PollingHandler = require('../handlers/continuousPollingHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS CONNECTED');

        /* Get some map parameters once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            if (map.response.error) {
                rustplus.log('Something went wrong with connection');
                rustplus.disconnect();
                return;
            }
            rustplus.log('SUCCESSFULLY CONNECTED!');

            rustplus.mapWidth = map.response.map.width;
            rustplus.mapHeight = map.response.map.height;
            rustplus.mapOceanMargin = map.response.map.oceanMargin;
            rustplus.mapMonuments = map.response.map.monuments;

            /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
            rustplus.intervalId = setInterval(PollingHandler.continuousPollingHandler, 10000, rustplus, client);
        });
    },
};
