module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('DISCONNECTED', 'RUSTPLUS DISCONNECTED');

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);

        let instance = client.readInstanceFile(rustplus.guildId);

        rustplus.firstPoll = true;

        rustplus.activeCargoShips = new Object();
        rustplus.activeChinook47s = new Object();
        rustplus.activeLockedCrates = new Object();
        rustplus.activePatrolHelicopters = new Object();
        rustplus.activeExplosions = new Object();
        rustplus.patrolHelicoptersLeft = [];
        rustplus.smallOilRigLockedCratesLeft = [];
        rustplus.largeOilRigLockedCratesLeft = [];
        rustplus.activeVendingMachines = [];
        rustplus.foundItems = [];
        rustplus.itemsToLookForId = [];

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
        rustplus.timeSinceChinookWasOut = null;
        rustplus.timeSinceBradleyWasDestroyed = null;
        rustplus.timeSinceHeliWasDestroyed = null;
        rustplus.timeSinceHeliWasOnMap = null;
        rustplus.timeSinceSmallOilRigWasTriggered = null;
        rustplus.timeSinceLargeOilRigWasTriggered = null;
        rustplus.timeSinceChinookDroppedCrate = null;

        /* Reset time variables */
        rustplus.passedFirstSunriseOrSunset = false;
        rustplus.startTime = null;
        rustplus.previousTime = null;
        rustplus.startTimeObject = new Object();
        rustplus.timeTillDay = new Object();
        rustplus.timeTillNight = new Object();

        rustplus.teamMembers = new Object();
        rustplus.markers = new Object();

        rustplus.informationIntervalCounter = 0;
        rustplus.interactionSwitches = [];

        if (rustplus.deleted) {
            return;
        }

        if (instance.serverList.hasOwnProperty(`${rustplus.server}-${rustplus.port}`)) {
            if (instance.serverList[`${rustplus.server}-${rustplus.port}`].active) {
                rustplus.log('RECONNECTING', 'RUSTPLUS RECONNECTING');
                rustplus.connect();
            }
        }
    },
};