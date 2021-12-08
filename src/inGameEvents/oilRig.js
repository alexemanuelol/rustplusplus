const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

const OIL_RIG_CHINOOK_47_MAX_DISTANCE = 550;

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if a Chinook 47 have been detected near any of the oil rigs */
        module.exports.checkNewChinook47Detected(rustplus, mapMarkers, info);

        /* Check to see if a Chinook 47 have disappeared from the map */
        module.exports.checkChinook47Left(rustplus, mapMarkers);
    },

    checkNewChinook47Detected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Chinook47) {
                if (!rustplus.currentChinook47sId.includes(marker.id)) {
                    rustplus.currentChinook47sId.push(marker.id);

                    let smallX, smallY, largeX, largeY;
                    for (let monument of rustplus.mapMonuments) {
                        if (monument.token === 'oil_rig_small') {
                            smallX = monument.x; smallY = monument.y;
                        }
                        else if (monument.token === 'large_oil_rig') {
                            largeX = monument.x; largeY = monument.y;
                        }
                    }

                    if (MapCalc.getDistance(marker.x, marker.y, smallX, smallY) <=
                        OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                        let str = 'Heavy Scientists got called to the Small Oil Rig';
                        if (rustplus.notificationSettings.heavyScientistCalled.discord) {
                            rustplus.sendEvent(str);
                        }
                        if (rustplus.notificationSettings.heavyScientistCalled.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.lockedCrateSmallOilRigTimer.restart();
                    }
                    else if (MapCalc.getDistance(marker.x, marker.y, largeX, largeY) <=
                        OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                        let str = 'Heavy Scientists got called to the Large Oil Rig';
                        if (rustplus.notificationSettings.heavyScientistCalled.discord) {
                            rustplus.sendEvent(str);
                        }
                        if (rustplus.notificationSettings.heavyScientistCalled.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.lockedCrateLargeOilRigTimer.restart();
                    }
                    else {
                        let mapSize = info.response.info.mapSize;
                        let spawnLocation = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);

                        /* Offset that is used to determine if coordinates is outside grid system */
                        let offset = 4 * MapCalc.gridDiameter;

                        /* If coordinates of the marker is located outside the grid system + the offset */
                        if (marker.x < -offset || marker.x > (mapSize + offset) ||
                            marker.y < -offset || marker.y > (mapSize + offset)) {
                            let str = `Chinook 47 enters the map from ${spawnLocation} ` +
                                'to drop off Locked Crate';
                            if (rustplus.notificationSettings.chinook47Detected.discord) {
                                rustplus.sendEvent(str);
                            }
                            if (rustplus.notificationSettings.chinook47Detected.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                        }
                        else {
                            let str = `Chinook 47 located at ${spawnLocation}`;
                            if (rustplus.notificationSettings.chinook47Detected.discord) {
                                rustplus.sendEvent(str);
                            }
                            if (rustplus.notificationSettings.chinook47Detected.inGame) {
                                rustplus.sendTeamMessage(`Event: ${str}`);
                            }
                        }
                    }
                }
            }
        }
    },

    checkChinook47Left: function (rustplus, mapMarkers) {
        let tempArray = [];
        for (let id of rustplus.currentChinook47sId) {
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.Chinook47) {
                    if (marker.id === id) {
                        /* Chinook 47 marker is still visable on the map */
                        tempArray.push(id);
                        break;
                    }
                }
            }
        }
        rustplus.currentChinook47sId = JSON.parse(JSON.stringify(tempArray));
    },

    notifyLockedCrateSmallOpen: function (rustplus) {
        let str = 'Locked Crate at Small Oil Rig has been unlocked';
        if (rustplus[0].notificationSettings.lockedCrateOilRigUnlocked.discord) {
            rustplus[0].sendEvent(str);
        }
        if (rustplus[0].notificationSettings.lockedCrateOilRigUnlocked.inGame) {
            rustplus[0].sendTeamMessage(`Event: ${str}`);
        }
        rustplus[0].lockedCrateSmallOilRigTimer.stop();
    },

    notifyLockedCrateLargeOpen: function (rustplus) {
        let str = 'Locked Crate at Large Oil Rig has been unlocked';
        if (rustplus[0].notificationSettings.lockedCrateOilRigUnlocked.discord) {
            rustplus[0].sendEvent(str);
        }
        if (rustplus[0].notificationSettings.lockedCrateOilRigUnlocked.inGame) {
            rustplus[0].sendTeamMessage(`Event: ${str}`);
        }
        rustplus[0].lockedCrateLargeOilRigTimer.stop();
    },
}