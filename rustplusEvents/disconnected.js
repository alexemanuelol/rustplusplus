module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);
    },
};