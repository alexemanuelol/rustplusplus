module.exports = {
    name: 'connecting',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log(client.intlGet(null, 'connectingCap'), client.intlGet(null, 'connectingToServer'));
    },
};