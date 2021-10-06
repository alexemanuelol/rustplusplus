const Main = require('./../index.js');
const InGameEventHandler = require('./../inGameEvents/inGameEventHandler.js');

module.exports = {
    name: 'connected',
    async execute(discord, rustplus) {
        console.log('RUSTPLUS CONNECTED');

        /* Get map width/height and oceanMargin once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            Main.mapWidth = map.response.map.width;
            Main.mapHeight = map.response.map.height;
            Main.mapOceanMargin = map.response.map.oceanMargin;
        });

        /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
        Main.intervalId = setInterval(InGameEventHandler.inGameEventHandler, 10000, discord, rustplus);
    },
};