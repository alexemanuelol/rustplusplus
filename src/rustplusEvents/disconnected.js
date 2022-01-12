module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        let instance = client.readInstanceFile(rustplus.guildId);

        /* Stop all timers */
        rustplus.cargoShipEgressTimer.stop();
        rustplus.bradleyRespawnTimer.stop();
        rustplus.lockedCrateDespawnTimer.stop();
        rustplus.lockedCrateDespawnWarningTimer.stop();
        rustplus.lockedCrateSmallOilRigTimer.stop();
        rustplus.lockedCrateLargeOilRigTimer.stop();

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);

        if (instance.serverList[`${rustplus.server}-${rustplus.port}`].active) {
            rustplus.log('RUSTPLUS RECONNECTING');
            rustplus.disconnect();
            rustplus.connect();
        }
    },
};