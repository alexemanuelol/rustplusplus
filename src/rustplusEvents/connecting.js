module.exports = {
    name: 'connecting',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log('CONNECTING', 'CONNECTING TO SERVER...');
    },
};