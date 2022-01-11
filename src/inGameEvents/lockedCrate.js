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
                        let str = 'Locked Crate just spawned on Cargo Ship';
                        if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateSpawnCargoShip.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateSpawnCargoShip.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
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
                            let str = 'Locked Crate just respawned on Small ' +
                                `${MonNames.Monument['oil_rig_small']}`;
                            if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateRespawnOilRig.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateRespawnOilRig.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                        }
                        else {
                            rustplus.currentLockedCratesId = rustplus.currentLockedCratesId.filter(e => e.name !== 'oil_rig_small');
                            rustplus.smallOilRigLeftChecker = false;
                        }
                    }
                    else if (closestMonument.token === 'large_oil_rig') {
                        /* Locked Crate at small/large oil rig randomly respawns and get a new id, so it needs to be
                        replaced in currentLockedCratesId as well */
                        if (!rustplus.currentLockedCratesId.some(e => e.name === 'large_oil_rig')) {
                            let str = 'Locked Crate just respawned on ' +
                                `${MonNames.Monument['large_oil_rig']}`;
                            if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateRespawnOilRig.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateRespawnOilRig.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                        }
                        else {
                            rustplus.currentLockedCratesId = rustplus.currentLockedCratesId.filter(e => e.name !== 'large_oil_rig');
                            rustplus.largeOilRigLeftChecker = false;
                        }
                    }
                    else {
                        if (!rustplus.firstPoll) {
                            let str = 'Locked Crate just got dropped by Chinook 47 at ' +
                                `${MonNames.Monument[closestMonument.token]}`;
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }

                            rustplus.lockedCrateDespawnTimer.restart();
                            rustplus.lockedCrateDespawnWarningTimer.restart();
                        }
                        else {
                            let str = 'Locked Crate located at ' +
                                `${MonNames.Monument[closestMonument.token]}`;
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                        }
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
                    let str = 'Locked Crate on Cargo Ship just got looted or despawned';
                    if (rustplus.notificationSettings.lockedCrateLeftCargoShip.discord) {
                        rustplus.sendEvent(str, 'locked_crate_logo.png');
                    }
                    if (rustplus.notificationSettings.lockedCrateLeftCargoShip.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                }
                else if (lockedCrate.name === 'oil_rig_small') {
                    if (!rustplus.smallOilRigLeftChecker) {
                        rustplus.smallOilRigLeftChecker = true;
                        tempArray.push({ id: lockedCrate.id, name: lockedCrate.name });
                        return;
                    }
                    rustplus.smallOilRigLeftChecker = false;

                    let str = 'Locked Crate at Small Oil Rig just got looted';
                    if (rustplus.notificationSettings.lockedCrateLootedOilRig.discord) {
                        rustplus.sendEvent(str, 'locked_crate_logo.png');
                    }
                    if (rustplus.notificationSettings.lockedCrateLootedOilRig.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                    rustplus.lockedCrateSmallOilRigTimer.stop();
                }
                else if (lockedCrate.name === 'large_oil_rig') {
                    if (!rustplus.largeOilRigLeftChecker) {
                        rustplus.largeOilRigLeftChecker = true;
                        tempArray.push({ id: lockedCrate.id, name: lockedCrate.name });
                        return;
                    }
                    rustplus.largeOilRigLeftChecker = false;

                    let str = 'Locked Crate at Large Oil Rig just got looted';
                    if (rustplus.notificationSettings.lockedCrateLootedOilRig.discord) {
                        rustplus.sendEvent(str, 'locked_crate_logo.png');
                    }
                    if (rustplus.notificationSettings.lockedCrateLootedOilRig.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                    rustplus.lockedCrateLargeOilRigTimer.stop();
                }
                else {
                    let timeLeft = rustplus.lockedCrateDespawnTimer.getTimeLeft();
                    let despawnOffset = 5 * 60 * 1000; /* 5 minutes offset value */
                    if (timeLeft > despawnOffset) {
                        /* The timer have reset, which might indicate that the Locked Crate despawned. */
                        let str = `Locked Crate at ${MonNames.Monument[lockedCrate.name]} ` + 'just got looted';
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                    }
                    else {
                        let str = `Locked Crate at ${MonNames.Monument[lockedCrate.name]} just despawned`;
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
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
        let str = `Locked Crate at ${rustplus[0].currentLockedCrateMonumentName} despawns in ` +
            `${Constants.LOCKED_CRATE_DESPAWN_WARNING_TIME_MS / (60 * 1000)} minutes`;
        if (rustplus[0].notificationSettings.lockedCrateMonumentDespawnWarning.discord) {
            rustplus[0].sendEvent(str, 'locked_crate_logo.png');
        }
        if (rustplus[0].notificationSettings.lockedCrateMonumentDespawnWarning.inGame) {
            rustplus[0].sendTeamMessage(`Event: ${str}`);
        }
        rustplus[0].lockedCrateDespawnWarningTimer.stop();
    },

}