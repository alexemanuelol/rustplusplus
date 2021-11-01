const InGameEventHandler = require('./../inGameEvents/inGameEventHandler.js');
const Main = require('./../index.js');

module.exports = {
    name: 'connected',
    async execute(rustplus) {
        console.log('RUSTPLUS CONNECTED');

        /* Get map width/height and oceanMargin once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            rustplus.mapWidth = map.response.map.width;
            rustplus.mapHeight = map.response.map.height;
            rustplus.mapOceanMargin = map.response.map.oceanMargin;
            rustplus.mapMonuments = map.response.map.monuments;
        });

        /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
        rustplus.intervalId = setInterval(InGameEventHandler.inGameEventHandler, 10000, rustplus);
    },
};