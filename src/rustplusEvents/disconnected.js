module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        /* Stop all timers */
        rustplus.cargoShipEgressTimer.stop();
        rustplus.bradleyRespawnTimer.stop();
        rustplus.lockedCrateDespawnTimer.stop();
        rustplus.lockedCrateDespawnWarningTimer.stop();
        rustplus.lockedCrateSmallOilRigTimer.stop();
        rustplus.lockedCrateLargeOilRigTimer.stop();

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);
    },
};