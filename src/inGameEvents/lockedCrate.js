const Constants = require('../util/eventConstants.js');
const MapCalc = require('../util/mapCalculations.js');
const MonNames = require('../util/monumentNames.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer');

const LOCKED_CRATE_MONUMENT_RADIUS = 150;
const LOCKED_CRATE_CARGO_SHIP_RADIUS = 100;
const LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS = 5;

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Locked Crate is detected */
        module.exports.checkNewLockedCrateDetected(rustplus, info, mapMarkers);

        /* Check to see if an Locked Crate marker have disappeared from the map */
        module.exports.checkLockedCrateLeft(rustplus, mapMarkers);
    },

    checkNewLockedCrateDetected: function (rustplus, info, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                let mapSize = info.response.info.mapSize;
                let outsidePos = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);
                let gridPos = MapCalc.getGridPos(marker.x, marker.y, mapSize);
                let pos = (gridPos === null) ? outsidePos : gridPos;

                if (!(marker.id in rustplus.activeLockedCrates)) {
                    /* New Locked Crate detected, save it */
                    rustplus.activeLockedCrates[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos
                    };

                    let closestMonument = module.exports.getClosestMonument(marker.x, marker.y, rustplus);
                    let distance = MapCalc.getDistance(marker.x, marker.y, closestMonument.x, closestMonument.y);

                    if (module.exports.isCrateOnCargoShip(marker.x, marker.y, mapMarkers)) {
                        let cargoShipId = module.exports.getCargoShipId(marker.x, marker.y, mapMarkers);

                        let str = `Locked Crate just spawned on Cargo Ship at ${pos}.`;
                        if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateSpawnCargoShip.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (!rustplus.firstPoll && rustplus.notificationSettings.lockedCrateSpawnCargoShip.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);

                        rustplus.activeLockedCrates[marker.id].type = 'cargoShip';
                        rustplus.activeLockedCrates[marker.id].cargoShipId = cargoShipId;

                        if (rustplus.activeCargoShips[cargoShipId]) {
                            rustplus.activeCargoShips[cargoShipId].crates.push(marker.id);
                        }
                    }
                    else if (closestMonument.token === 'oil_rig_small' &&
                        distance < LOCKED_CRATE_MONUMENT_RADIUS) {
                        if (rustplus.smallOilRigLeftEntities.some(e =>
                            e.type === 'oil_rig_small' &&
                            MapCalc.getDistance(e.x, e.y, marker.x, marker.y) < LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS)) {
                            /* Refresh of Locked Crate at Small Oil Rig, Scenario 1 */
                            for (let crate of rustplus.smallOilRigLeftEntities) {
                                if (crate.type === 'oil_rig_small' &&
                                    MapCalc.getDistance(crate.x, crate.y, marker.x, marker.y) <
                                    LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                                    delete rustplus.activeLockedCrates[crate.id];
                                }
                            }
                        }
                        else {
                            let refreshed = false;
                            for (const [id, content] of Object.entries(rustplus.activeLockedCrates)) {
                                if (content.type === 'oil_rig_small' &&
                                    MapCalc.getDistance(content.x, content.y, marker.x, marker.y) <
                                    LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                                    /* Refresh of Locked Crate at Small Oil Rig, Scenario 2 */
                                    refreshed = true;
                                }
                            }

                            if (!refreshed && !rustplus.firstPoll) {
                                let oilRig = MonNames.Monument['oil_rig_small'];
                                let str = `Locked Crate just respawned on Small ${oilRig} at ${pos}.`;
                                if (rustplus.notificationSettings.lockedCrateRespawnOilRig.discord) {
                                    rustplus.sendEvent(str, 'locked_crate_logo.png');
                                }
                                if (rustplus.notificationSettings.lockedCrateRespawnOilRig.inGame) {
                                    rustplus.sendTeamMessage(`Event: ${str}`);
                                }
                                rustplus.log(str);
                            }
                        }

                        rustplus.activeLockedCrates[marker.id].type = 'oil_rig_small';
                    }
                    else if (closestMonument.token === 'large_oil_rig' &&
                        distance < LOCKED_CRATE_MONUMENT_RADIUS) {
                        if (rustplus.largeOilRigLeftEntities.some(e =>
                            e.type === 'large_oil_rig' &&
                            MapCalc.getDistance(e.x, e.y, marker.x, marker.y) < LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS)) {
                            /* Refresh of Locked Crate at Large Oil Rig, Scenario 1 */
                            for (let crate of rustplus.largeOilRigLeftEntities) {
                                if (crate.type === 'large_oil_rig' &&
                                    MapCalc.getDistance(crate.x, crate.y, marker.x, marker.y) <
                                    LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                                    delete rustplus.activeLockedCrates[crate.id];
                                }
                            }
                        }
                        else {
                            let refreshed = false;
                            for (const [id, content] of Object.entries(rustplus.activeLockedCrates)) {
                                if (content.type === 'large_oil_rig' &&
                                    MapCalc.getDistance(content.x, content.y, marker.x, marker.y) <
                                    LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                                    /* Refresh of Locked Crate at Large Oil Rig, Scenario 2 */
                                    refreshed = true;
                                }
                            }

                            if (!refreshed && !rustplus.firstPoll) {
                                let oilRig = MonNames.Monument['large_oil_rig'];
                                let str = `Locked Crate just respawned on ${oilRig} at ${pos}.`;
                                if (rustplus.notificationSettings.lockedCrateRespawnOilRig.discord) {
                                    rustplus.sendEvent(str, 'locked_crate_logo.png');
                                }
                                if (rustplus.notificationSettings.lockedCrateRespawnOilRig.inGame) {
                                    rustplus.sendTeamMessage(`Event: ${str}`);
                                }
                                rustplus.log(str);
                            }
                        }

                        rustplus.activeLockedCrates[marker.id].type = 'large_oil_rig';
                    }
                    else if (distance > LOCKED_CRATE_MONUMENT_RADIUS) {
                        if (!MapCalc.isOutsideGridSystem(marker.x, marker.y, mapSize)) {
                            if (!rustplus.firstPoll) {
                                let str = `Locked Crate just dropped at ${pos}.`;
                                if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                    rustplus.sendEvent(str, 'locked_crate_logo.png');
                                }
                                if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                    rustplus.sendTeamMessage(`Event: ${str}`);
                                }
                                rustplus.log(str);
                            }
                            else {
                                let str = `Locked Crate located at ${pos}.`;
                                if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                    rustplus.sendEvent(str, 'locked_crate_logo.png');
                                }
                                if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                    rustplus.sendTeamMessage(`Event: ${str}`);
                                }
                                rustplus.log(str);
                            }

                            rustplus.activeLockedCrates[marker.id].type = 'grid';
                        }
                        else {
                            /* Locked Crate is located outside the grid system, might be an invalid Locked Crate */
                            rustplus.activeLockedCrates[marker.id].type = 'invalid';
                        }
                    }
                    else {
                        if (!rustplus.firstPoll) {
                            let str = 'Locked Crate just got dropped by Chinook 47 at ' +
                                `${MonNames.Monument[closestMonument.token]}.`;
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                            rustplus.log(str);

                            rustplus.lockedCrateDespawnTimers[marker.id] = new Timer.timer(
                                () => { },
                                Constants.LOCKED_CRATE_DESPAWN_TIME_MS);
                            rustplus.lockedCrateDespawnTimers[marker.id].start();

                            rustplus.lockedCrateDespawnWarningTimers[marker.id] = new Timer.timer(
                                module.exports.notifyLockedCrateWarningDespawn,
                                Constants.LOCKED_CRATE_DESPAWN_TIME_MS - Constants.LOCKED_CRATE_DESPAWN_WARNING_TIME_MS,
                                rustplus,
                                MonNames.Monument[closestMonument.token]);
                            rustplus.lockedCrateDespawnWarningTimers[marker.id].start();
                        }
                        else {
                            let str = 'Locked Crate located at ' +
                                `${MonNames.Monument[closestMonument.token]}.`;
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.discord) {
                                rustplus.sendEvent(str, 'locked_crate_logo.png');
                            }
                            if (rustplus.notificationSettings.lockedCrateDroppedAtMonument.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                            rustplus.log(str);
                        }

                        rustplus.activeLockedCrates[marker.id].type = MonNames.Monument[closestMonument.token];
                    }
                }
                else {
                    /* Update Locked Crate position */
                    rustplus.activeLockedCrates[marker.id].x = marker.x;
                    rustplus.activeLockedCrates[marker.id].y = marker.y;
                    rustplus.activeLockedCrates[marker.id].location = pos;
                }
            }
        }

        /* Reset Locked Crate Left Entities arrays */
        rustplus.smallOilRigLeftEntities = [];
        rustplus.largeOilRigLeftEntities = [];
    },

    checkLockedCrateLeft: function (rustplus, mapMarkers) {
        let newActiveLockedCratesObject = new Object();
        for (const [id, content] of Object.entries(rustplus.activeLockedCrates)) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                    if (marker.id === parseInt(id)) {
                        /* Locked Crate marker is still visable on the map */
                        active = true;
                        newActiveLockedCratesObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type
                        };

                        if (content.type === 'cargoShip') {
                            newActiveLockedCratesObject[parseInt(id)].cargoShipId = content.cargoShipId;
                        }
                        break;
                    }
                }
            }

            if (active === false) {
                if (content.type === 'cargoShip') {
                    let str = `Locked Crate on Cargo Ship at ${content.location} just got looted.`;
                    if (rustplus.notificationSettings.lockedCrateLeftCargoShip.discord) {
                        rustplus.sendEvent(str, 'locked_crate_logo.png');
                    }
                    if (rustplus.notificationSettings.lockedCrateLeftCargoShip.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                    rustplus.log(str);
                }
                else if (content.type === 'grid') {
                    let str = `Locked Crate at ${content.location} just got looted or despawned.`;
                    if (rustplus.notificationSettings.lockedCrateMonumentLeft.discord) {
                        rustplus.sendEvent(str, 'locked_crate_logo.png');
                    }
                    if (rustplus.notificationSettings.lockedCrateMonumentLeft.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                    rustplus.log(str);
                }
                else if (content.type === 'invalid') {
                    /* Invalid Locked Crate, we don't care */
                }
                else if (content.type === 'oil_rig_small') {
                    if (rustplus.lockedCrateSmallOilRigTimers[parseInt(id)]) {
                        rustplus.lockedCrateSmallOilRigTimers[parseInt(id)].stop();
                        delete rustplus.lockedCrateSmallOilRigTimers[parseInt(id)];
                    }

                    if (content.fakeLeft === true) {
                        let str = `Locked Crate at Small Oil Rig at ${content.location} just got looted.`;
                        if (rustplus.notificationSettings.lockedCrateLootedOilRig.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateLootedOilRig.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                        continue;
                    }

                    let refreshed = false;
                    for (const [idx, contentx] of Object.entries(rustplus.activeLockedCrates)) {
                        if (contentx.type === content.type &&
                            MapCalc.getDistance(contentx.x, contentx.y, content.x, content.y) <
                            LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS &&
                            idx !== id) {
                            /* Refresh of Locked Crate at Small Oil Rig, Scenario 2 */
                            refreshed = true;
                        }
                    }

                    if (!refreshed) {
                        /* Scenario 1 */
                        rustplus.smallOilRigLeftEntities.push({
                            id: parseInt(id),
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type
                        });

                        /* Add it with fakeLeft, in case it actually was looted rather than refreshed */
                        newActiveLockedCratesObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type,
                            fakeLeft: true
                        };
                    }
                }
                else if (content.type === 'large_oil_rig') {
                    if (rustplus.lockedCrateLargeOilRigTimers[parseInt(id)]) {
                        rustplus.lockedCrateLargeOilRigTimers[parseInt(id)].stop();
                        delete rustplus.lockedCrateLargeOilRigTimers[parseInt(id)];
                    }

                    if (content.fakeLeft === true) {
                        let str = `Locked Crate at Large Oil Rig at ${content.location} just got looted.`;
                        if (rustplus.notificationSettings.lockedCrateLootedOilRig.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateLootedOilRig.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                        continue;
                    }

                    let refreshed = false;
                    for (const [idx, contentx] of Object.entries(rustplus.activeLockedCrates)) {
                        if (contentx.type === content.type &&
                            MapCalc.getDistance(contentx.x, contentx.y, content.x, content.y) <
                            LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS &&
                            idx !== id) {
                            /* Refresh of Locked Crate at Large Oil Rig, Scenario 2 */
                            refreshed = true;
                        }
                    }

                    if (!refreshed) {
                        /* Scenario 1 */
                        rustplus.largeOilRigLeftEntities.push({
                            id: parseInt(id),
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type
                        });

                        /* Add it with fakeLeft, in case it actually was looted rather than refreshed */
                        newActiveLockedCratesObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type,
                            fakeLeft: true
                        };
                    }
                }
                else {
                    let timeLeft = null;
                    let despawnOffset = 5 * 60 * 1000; /* 5 minutes offset value */

                    if (rustplus.lockedCrateDespawnWarningTimers.hasOwnProperty(parseInt(id))) {
                        timeLeft = rustplus.lockedCrateDespawnTimers[parseInt(id)].getTimeLeft();
                    }
                    else {
                        timeLeft = despawnOffset;
                    }

                    if (timeLeft > despawnOffset) {
                        /* The timer have reset, which might indicate that the Locked Crate despawned. */
                        let str = `Locked Crate at ${content.location} just got looted.`;
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }
                    else {
                        let str = `Locked Crate at ${content.location} just despawned.`;
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.discord) {
                            rustplus.sendEvent(str, 'locked_crate_logo.png');
                        }
                        if (rustplus.notificationSettings.lockedCrateMonumentLeft.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }

                    if (rustplus.lockedCrateDespawnTimers[parseInt(id)]) {
                        rustplus.lockedCrateDespawnTimers[parseInt(id)].stop();
                        delete rustplus.lockedCrateDespawnTimers[parseInt(id)];
                    }
                    if (rustplus.lockedCrateDespawnWarningTimers[parseInt(id)]) {
                        rustplus.lockedCrateDespawnWarningTimers[parseInt(id)].stop();
                        delete rustplus.lockedCrateDespawnWarningTimers[parseInt(id)];
                    }
                }
            }
        }
        rustplus.activeLockedCrates = JSON.parse(JSON.stringify(newActiveLockedCratesObject));
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
        let closestMonument = null;
        for (let monument of rustplus.mapMonuments) {
            let distance = MapCalc.getDistance(x, y, monument.x, monument.y);
            if (distance < minDistance && module.exports.validLockedCrateMonuments.includes(monument.token)) {
                minDistance = distance;
                closestMonument = monument;
            }
        }

        return closestMonument;
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

    getCargoShipId: function (x, y, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                if (MapCalc.getDistance(x, y, marker.x, marker.y) <= LOCKED_CRATE_CARGO_SHIP_RADIUS) {
                    return marker.id;
                }
            }
        }

        return null;
    },

    notifyLockedCrateWarningDespawn: function (args) {
        let str = `Locked Crate at ${args[1]} despawns in ` +
            `${Constants.LOCKED_CRATE_DESPAWN_WARNING_TIME_MS / (60 * 1000)} minutes.`;
        if (args[0].notificationSettings.lockedCrateMonumentDespawnWarning.discord) {
            args[0].sendEvent(str, 'locked_crate_logo.png');
        }
        if (args[0].notificationSettings.lockedCrateMonumentDespawnWarning.inGame) {
            args[0].sendTeamMessage(`Event: ${str}`);
        }
        args[0].log(str);
    },
}