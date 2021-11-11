const MapCalc = require('../util/mapCalculations.js');
const MonNames = require('../util/monumentNames.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Constants = require('../util/eventConstants.js');

const LOCKED_CRATE_MONUMENT_RADIUS = 150;
const LOCKED_CRATE_CARGO_SHIP_RADIUS = 100;

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Locked Crate is detected */
        module.exports.checkNewLockedCrateDetected(rustplus, mapMarkers);

        /* Check to see if an Locked Crate marker have disappeared from the map */
        module.exports.checkLockedCrateLeft(rustplus, mapMarkers);
    },

    checkNewLockedCrateDetected: function (rustplus, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                if (!rustplus.currentLockedCratesId.some(e => e.id === marker.id)) {
                    let closestMonument = module.exports.getClosestMonument(marker.x, marker.y, rustplus);
                    let distance = MapCalc.getDistance(marker.x, marker.y, closestMonument.x, closestMonument.y);

                    if (module.exports.isCrateOnCargoShip(marker.x, marker.y, mapMarkers)) {
                        /* Locked Crate is located on Cargo Ship */
                        rustplus.sendEvent('Locked Crate just spawned on Cargo Ship');
                        rustplus.currentLockedCratesId.push({ id: marker.id, name: 'cargo_ship' });
                        continue;
                    }
                    else if (distance > LOCKED_CRATE_MONUMENT_RADIUS) {
                        /* Locked Crate is way too far away from a monument, must be an invalid Locked Crate */
                        continue;
                    }
                    else if (closestMonument.token === 'oil_rig_small') {
                        /* Locked Crate at small/large oil rig randomly respawns and get a new id, so it needs to be
                        replaced in currentLockedCratesId as well */
                        if (!rustplus.currentLockedCratesId.some(e => e.name === 'oil_rig_small')) {
                            rustplus.sendEvent('Locked Crate just respawned on Small' +
                                `${MonNames.Monument['oil_rig_small']}`);
                        }
                        else {
                            rustplus.currentLockedCratesId = rustplus.currentLockedCratesId.filter(e => e.name !== 'oil_rig_small');
                        }
                    }
                    else if (closestMonument.token === 'large_oil_rig') {
                        /* Locked Crate at small/large oil rig randomly respawns and get a new id, so it needs to be
                        replaced in currentLockedCratesId as well */
                        if (!rustplus.currentLockedCratesId.some(e => e.name === 'large_oil_rig')) {
                            rustplus.sendEvent(`Locked Crate just respawned on ${MonNames.Monument['large_oil_rig']}`);
                        }
                        else {
                            rustplus.currentLockedCratesId = rustplus.currentLockedCratesId.filter(e => e.name !== 'large_oil_rig');
                        }
                    }
                    else {
                        rustplus.sendEvent('Locked Crate just got dropped by Chinook 47 at ' +
                            `${MonNames.Monument[closestMonument.token]}`);

                        rustplus.lockedCrateDespawnTimer.restart();
                        rustplus.lockedCrateDespawnWarningTimer.restart();
                        rustplus.currentLockedCrateMonumentName = MonNames.Monument[closestMonument.token];
                    }
                    rustplus.currentLockedCratesId.push({ id: marker.id, name: closestMonument.token });
                }
            }
        }
    },

    checkLockedCrateLeft: function (rustplus, mapMarkers) {
        let tempArray = [];
        rustplus.currentLockedCratesId.forEach((lockedCrate) => {
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
                    rustplus.sendEvent('Locked Crate on Cargo Ship just got looted or despawned');
                }
                else if (lockedCrate.name === 'oil_rig_small') {
                    rustplus.sendEvent('Locked Crate at Small Oil Rig just got looted');
                    rustplus.lockedCrateSmallOilRigTimer.stop();
                }
                else if (lockedCrate.name === 'large_oil_rig') {
                    rustplus.sendEvent('Locked Crate at Large Oil Rig just got looted');
                    rustplus.lockedCrateLargeOilRigTimer.stop();
                }
                else {
                    let timeLeft = rustplus.lockedCrateDespawnTimer.getTimeLeft();
                    let despawnOffset = 5 * 60 * 1000; /* 5 minutes offset value */
                    if (timeLeft > despawnOffset) {
                        /* The timer have reset, which might indicate that the Locked Crate despawned. */
                        rustplus.sendEvent(`Locked Crate at ${MonNames.Monument[lockedCrate.name]} just got looted`);
                    }
                    else {
                        rustplus.sendEvent(`Locked Crate at ${MonNames.Monument[lockedCrate.name]} just despawned`);
                    }
                    rustplus.lockedCrateDespawnTimer.stop();
                    rustplus.lockedCrateDespawnWarningTimer.stop();
                    rustplus.currentLockedCrateMonumentName = null;
                }
            }
        });
        rustplus.currentLockedCratesId = JSON.parse(JSON.stringify(tempArray));
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

    getClosestMonument: function (x, y, rustplus) {
        let minDistance = 1000000;
        let minDistanceMonument = null;
        for (let monument of rustplus.mapMonuments) {
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

    notifyLockedCrateWarningDespawn: function (rustplus) {
        rustplus[0].sendEvent(`Locked Crate at ${rustplus.currentLockedCrateMonumentName} despawns in ` +
            `${Constants.LOCKED_CRATE_DESPAWN_WARNING_TIME_MS / (60 * 1000)} minutes`);
        rustplus[0].lockedCrateDespawnWarningTimer.stop();
    },

}