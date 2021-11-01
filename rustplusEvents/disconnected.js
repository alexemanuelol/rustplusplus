const Main = require('./../index.js');

module.exports = {
    name: 'disconnected',
    async execute(rustplus) {
        console.log('RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(Main.intervalId);
    },
};