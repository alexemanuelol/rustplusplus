module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        let instance = client.readInstanceFile(rustplus.guildId);

        /* Stop all timers */
        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            timer.stop();
        }
        rustplus.cargoShipEgressTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateSmallOilRigTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateSmallOilRigTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateLargeOilRigTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateLargeOilRigTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateDespawnTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateDespawnTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.lockedCrateDespawnWarningTimers)) {
            timer.stop();
        }
        rustplus.lockedCrateDespawnWarningTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            timer.stop();
        }
        rustplus.bradleyRespawnTimers = new Object();

        for (const [id, timer] of Object.entries(rustplus.timers)) {
            timer.stop();
        }
        rustplus.timers = new Object();

        /* Reset dates */
        rustplus.timeSinceCargoWasOut = null;
        rustplus.timeSinceBradleyWasDestroyed = null;
        rustplus.timeSinceHeliWasDestroyed = null;
        rustplus.timeSinceHeliWasOnMap = null;
        rustplus.timeSinceSmallOilRigWasTriggered = null;
        rustplus.timeSinceLargeOilRigWasTriggered = null;

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);

        if (instance.serverList.hasOwnProperty(`${rustplus.server}-${rustplus.port}`)) {
            if (instance.serverList[`${rustplus.server}-${rustplus.port}`].active) {
                rustplus.log('RUSTPLUS RECONNECTING');
                rustplus.disconnect();
                rustplus.connect();
            }
        }
    },
};