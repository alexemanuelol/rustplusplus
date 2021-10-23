const Main = require('./../index.js');
const MapCalc = require('./../utils/mapCalculations.js');
const MonNames = require('./../utils/monumentNames.js');
const RustPlusTypes = require('../utils/rustplusTypes.js');
const Timer = require('./../utils/timer.js');

const LOCKED_CRATE_MONUMENT_RADIUS = 150;
const LOCKED_CRATE_CARGO_SHIP_RADIUS = 100;

/* Default 2 hour decay time */
const LOCKED_CRATE_DESPAWN_TIME_MIN = 120;
const LOCKED_CRATE_DESPAWN_TIME_MS = LOCKED_CRATE_DESPAWN_TIME_MIN * 60 * 1000;

/* Warn 20 minutes before despawn */
const LOCKED_CRATE_DESPAWN_WARNING_TIME_MIN = 20;
const LOCKED_CRATE_DESPAWN_WARNING_TIME_MS = LOCKED_CRATE_DESPAWN_WARNING_TIME_MIN * 60 * 1000;

var currentLockedCratesId = [];
var lockedCrateDespawnTimer = new Timer.timer(() => { }, LOCKED_CRATE_DESPAWN_TIME_MS);
var lockedCrateDespawnWarningTimer = new Timer.timer(notifyLockedCrateWarningDespawn,
    LOCKED_CRATE_DESPAWN_TIME_MS - LOCKED_CRATE_DESPAWN_WARNING_TIME_MS);
var currentLockedCrateMonumentName = null;

function notifyLockedCrateWarningDespawn() {
    /* Notifies when there is LOCKED_CRATE_DESPAWN_WARNING_TIME_MIN minutes before Locked Crate despawns */
    console.log('Locked Crate at ' + currentLockedCrateMonumentName + ' despawns in ' +
        LOCKED_CRATE_DESPAWN_WARNING_TIME_MIN + ' minutes');
    lockedCrateDespawnWarningTimer.stop();
}

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new Locked Crate is detected */
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                if (!currentLockedCratesId.some(e => e.id === marker.id)) {
                    let closestMonument = module.exports.getClosestMonument(marker.x, marker.y);
                    let distance = MapCalc.getDistance(marker.x, marker.y, closestMonument.x, closestMonument.y);

                    if (module.exports.isCrateOnCargoShip(marker.x, marker.y, mapMarkers)) {
                        /* Locked Crate is located on Cargo Ship */
                        console.log('Locked Crate just spawned on Cargo Ship');
                        currentLockedCratesId.push({ id: marker.id, name: 'cargo_ship' });
                        continue;
                    }
                    else if (distance > LOCKED_CRATE_MONUMENT_RADIUS) {
                        /* Locked Crate is way too far away from a monument, must be an invalid Locked Crate */
                        continue;
                    }
                    else if (closestMonument.token === 'oil_rig_small') {
                        /* Locked Crate at small/large oil rig randomly respawns and get a new id, so it needs to be
                        replaced in currentLockedCratesId as well */
                        if (!currentLockedCratesId.some(e => e.name === 'oil_rig_small')) {
                            console.log('Locked Crate just respawned on ' + MonNames.Monument['oil_rig_small']);
                        }
                        else {
                            currentLockedCratesId = currentLockedCratesId.filter(e => e.name !== 'oil_rig_small');
                        }
                    }
                    else if (closestMonument.token === 'large_oil_rig') {
                        /* Locked Crate at small/large oil rig randomly respawns and get a new id, so it needs to be
                        replaced in currentLockedCratesId as well */
                        if (!currentLockedCratesId.some(e => e.name === 'large_oil_rig')) {
                            console.log('Locked Crate just respawned on ' + MonNames.Monument['large_oil_rig']);
                        }
                        else {
                            currentLockedCratesId = currentLockedCratesId.filter(e => e.name !== 'large_oil_rig');
                        }
                    }
                    else {
                        console.log('Locked Crate just got dropped by Chinook 47 at ' +
                            MonNames.Monument[closestMonument.token]);

                        lockedCrateDespawnTimer.restart();
                        lockedCrateDespawnWarningTimer.restart();
                        currentLockedCrateMonumentName = MonNames.Monument[closestMonument.token];
                    }
                    currentLockedCratesId.push({ id: marker.id, name: closestMonument.token });
                }
            }
        }

        /* Check to see if an Locked Crate marker have disappeared from the map */
        let tempArray = [];
        currentLockedCratesId.forEach((lockedCrate) => {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                    if (marker.id === lockedCrate.id) {
                        /* Locked Crate is still visable on the map */
                        active = true;
                        tempArray.push({ id: lockedCrate.id, name: lockedCrate.name });
                        break;
                    }
                }
            }

            if (active === false) {
                if (lockedCrate.name === 'cargo_ship') {
                    console.log('Locked Crate on Cargo Ship just got looted');
                }
                else if (lockedCrate.name === 'oil_rig_small') {
                    console.log('Locked Crate at Small Oil Rig just got looted');
                }
                else if (lockedCrate.name === 'large_oil_rig') {
                    console.log('Locked Crate at Large Oil Rig just got looted');
                }
                else {
                    let timeLeft = lockedCrateDespawnTimer.getTimeLeft();
                    let despawnOffset = 5 * 60 * 1000; /* 5 minutes offset value */
                    if (timeLeft > despawnOffset) {
                        /* The timer have reset, which might indicate that the Locked Crate despawned. */
                        console.log('Locked Crate at ' + MonNames.Monument[lockedCrate.name] + " just got looted");
                    }
                    else {
                        console.log('Locked Crate at ' + MonNames.Monument[lockedCrate.name] + " just despawned");
                    }
                    lockedCrateDespawnTimer.stop();
                    lockedCrateDespawnWarningTimer.stop();
                    currentLockedCrateMonumentName = null;
                }
            }
        });
        currentLockedCratesId = JSON.parse(JSON.stringify(tempArray));
    },

    validLockedCrateMonuments: [
        'airfield_display_name',
        'dome_monument_name',
        'excavator',
        'harbor_2_display_name',
        'harbor_display_name',
        'junkyard_display_name',
        'large_oil_rig',
        'launchsite',
        'military_tunnels_display_name',
        'oil_rig_small',
        'power_plant_display_name',
        'satellite_dish_display_name',
        'sewer_display_name',
        'train_yard_display_name',
        'water_treatment_plant_display_name'
    ],

    getClosestMonument: function (x, y) {
        let minDistance = 1000000;
        let minDistanceMonument = null;
        for (let monument of Main.mapMonuments) {
            let distance = MapCalc.getDistance(x, y, monument.x, monument.y);
            if (distance < minDistance && module.exports.validLockedCrateMonuments.includes(monument.token)) {
                minDistance = distance;
                minDistanceMonument = monument;
            }
        }

        return minDistanceMonument;
    },

    isCrateOnCargoShip: function (x, y, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                if (MapCalc.getDistance(x, y, marker.x, marker.y) <= LOCKED_CRATE_CARGO_SHIP_RADIUS) {
                    return true;
                }
            }
        }
        return false;
    },

    getTimerTimeLeft: function () {
        /* Returns the time left before the Locked Crate is despawned, if timer is not running,
        null will be sent back */
        if (lockedCrateDespawnTimer.getStateRunning()) {
            return Timer.secondsToFullScale(lockedCrateDespawnTimer.getTimeLeft() / 1000);
        }
        return null;
    },
}

// TODO: Add discord notifications for the events