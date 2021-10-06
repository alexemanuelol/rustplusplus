const Main = require('./../index.js');

module.exports = {
    name: 'disconnected',
    async execute(discord, rustplus) {
        console.log('RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(Main.intervalId);
    },
};