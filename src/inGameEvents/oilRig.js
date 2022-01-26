const Constants = require('../util/eventConstants.js');
const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer');

const OIL_RIG_CHINOOK_47_MAX_DISTANCE = 550;

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if a Chinook 47 have been detected near any of the oil rigs */
        module.exports.checkNewChinook47Detected(rustplus, info, mapMarkers);

        /* Check to see if a Chinook 47 have disappeared from the map */
        module.exports.checkChinook47Left(rustplus, mapMarkers);
    },

    checkNewChinook47Detected: function (rustplus, info, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Chinook47) {
                let mapSize = info.response.info.mapSize;
                let outsidePos = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);
                let gridPos = MapCalc.getGridPos(marker.x, marker.y, mapSize);
                let pos = (gridPos === null) ? outsidePos : gridPos;

                if (!(marker.id in rustplus.activeChinook47s)) {
                    /* New Chinook 47 detected, save it */
                    rustplus.activeChinook47s[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos
                    };

                    let smallOil = [], largeOil = [];
                    for (let monument of rustplus.mapMonuments) {
                        if (monument.token === 'oil_rig_small') {
                            smallOil.push({ x: monument.x, y: monument.y })
                        }
                        else if (monument.token === 'large_oil_rig') {
                            largeOil.push({ x: monument.x, y: monument.y })
                        }
                    }

                    let found = false;
                    for (let rig of smallOil) {
                        if (MapCalc.getDistance(marker.x, marker.y, rig.x, rig.y) <=
                            OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                            found = true;
                            let oilRigLocation = MapCalc.getCoordinatesOrientation(rig.x, rig.y, mapSize);

                            let str = `Heavy Scientists got called to the Small Oil Rig at ${oilRigLocation}.`;
                            if (rustplus.notificationSettings.heavyScientistCalled.discord) {
                                rustplus.sendEvent(str, 'small_oil_rig_logo.png');
                            }
                            if (rustplus.notificationSettings.heavyScientistCalled.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                            rustplus.log(str);

                            let lockedCrateId = module.exports.getOilRigLockedCrateId(rig.x, rig.y, mapMarkers);

                            if (lockedCrateId !== null) {
                                rustplus.lockedCrateSmallOilRigTimers[lockedCrateId] = new Timer.timer(
                                    module.exports.notifyLockedCrateSmallOpen,
                                    Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
                                    rustplus,
                                    oilRigLocation);
                                rustplus.lockedCrateSmallOilRigTimers[lockedCrateId].start();
                            }
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }

                    for (let rig of largeOil) {
                        if (MapCalc.getDistance(marker.x, marker.y, rig.x, rig.y) <=
                            OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                            found = true;
                            let oilRigLocation = MapCalc.getCoordinatesOrientation(rig.x, rig.y, mapSize);

                            let str = `Heavy Scientists got called to the Large Oil Rig at ${oilRigLocation}.`;
                            if (rustplus.notificationSettings.heavyScientistCalled.discord) {
                                rustplus.sendEvent(str, 'large_oil_rig_logo.png');
                            }
                            if (rustplus.notificationSettings.heavyScientistCalled.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                            rustplus.log(str);

                            let lockedCrateId = module.exports.getOilRigLockedCrateId(rig.x, rig.y, mapMarkers);

                            if (lockedCrateId !== null) {
                                rustplus.lockedCrateLargeOilRigTimers[lockedCrateId] = new Timer.timer(
                                    module.exports.notifyLockedCrateLargeOpen,
                                    Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
                                    rustplus,
                                    oilRigLocation);
                                rustplus.lockedCrateLargeOilRigTimers[lockedCrateId].start();
                            }
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }

                    /* Offset that is used to determine if coordinates is outside grid system */
                    let offset = 4 * MapCalc.gridDiameter;

                    /* If coordinates of the marker is located outside the grid system + the offset */
                    if (MapCalc.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        let str = `Chinook 47 enters the map from ${pos} to drop off Locked Crate.`;
                        if (rustplus.notificationSettings.chinook47Detected.discord) {
                            rustplus.sendEvent(str, 'chinook_47_logo.png');
                        }
                        if (rustplus.notificationSettings.chinook47Detected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }
                    else {
                        let str = `Chinook 47 located at ${pos}.`;
                        if (rustplus.notificationSettings.chinook47Detected.discord) {
                            rustplus.sendEvent(str, 'chinook_47_logo.png');
                        }
                        if (rustplus.notificationSettings.chinook47Detected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }
                }
                else {
                    /* Update Chinook 47 position */
                    rustplus.activeChinook47s[marker.id].x = marker.x;
                    rustplus.activeChinook47s[marker.id].y = marker.y;
                    rustplus.activeChinook47s[marker.id].location = pos;
                }
            }
        }
    },

    getOilRigLockedCrateId: function (x, y, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.LockedCrate) {
                if (MapCalc.getDistance(x, y, marker.x, marker.y) < 100) {
                    return marker.id;
                }
            }
        }

        return null;
    },

    checkChinook47Left: function (rustplus, mapMarkers) {
        let newActiveChinook47Object = new Object();
        for (const [id, content] of Object.entries(rustplus.activeChinook47s)) {
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.Chinook47) {
                    if (marker.id === parseInt(id)) {
                        /* Chinook 47 marker is still visable on the map */
                        newActiveChinook47Object[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location
                        };
                        break;
                    }
                }
            }
        }
        rustplus.activeChinook47s = JSON.parse(JSON.stringify(newActiveChinook47Object));
    },

    notifyLockedCrateSmallOpen: function (args) {
        let str = `Locked Crate at Small Oil Rig at ${args[1]} has been unlocked.`;
        if (args[0].notificationSettings.lockedCrateOilRigUnlocked.discord) {
            args[0].sendEvent(str, 'locked_crate_logo.png');
        }
        if (args[0].notificationSettings.lockedCrateOilRigUnlocked.inGame) {
            args[0].sendTeamMessage(`Event: ${str}`);
        }
        args[0].log(str);
    },

    notifyLockedCrateLargeOpen: function (args) {
        let str = `Locked Crate at Large Oil Rig at ${args[1]} has been unlocked.`;
        if (args[0].notificationSettings.lockedCrateOilRigUnlocked.discord) {
            args[0].sendEvent(str, 'locked_crate_logo.png');
        }
        if (args[0].notificationSettings.lockedCrateOilRigUnlocked.inGame) {
            args[0].sendTeamMessage(`Event: ${str}`);
        }
        args[0].log(str);
    },
}