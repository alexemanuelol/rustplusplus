const Constants = require('../util/eventConstants.js');
const Map = require('../util/map.js');
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
                let mapSize = Map.getCorrectedMapSize(info.response.info.mapSize);
                let pos = Map.getPos(marker.x, marker.y, mapSize);

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
                        if (Map.getDistance(marker.x, marker.y, rig.x, rig.y) <=
                            OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                            found = true;
                            let oilRigLocation = Map.getPos(rig.x, rig.y, mapSize);
                            rustplus.activeChinook47s[marker.id].type = 'smallOil';

                            rustplus.sendEvent(
                                rustplus.notificationSettings.heavyScientistCalled,
                                `Heavy Scientists got called to the Small Oil Rig at ${oilRigLocation}.`,
                                rustplus.firstPoll,
                                'small_oil_rig_logo.png');

                            let lockedCrateId = module.exports.getOilRigLockedCrateId(rig.x, rig.y, mapMarkers);

                            if (lockedCrateId !== null) {
                                rustplus.lockedCrateSmallOilRigTimers[lockedCrateId] = new Timer.timer(
                                    module.exports.notifyLockedCrateSmallOpen,
                                    Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
                                    rustplus,
                                    oilRigLocation,
                                    lockedCrateId);
                                rustplus.lockedCrateSmallOilRigTimers[lockedCrateId].start();
                            }

                            rustplus.timeSinceSmallOilRigWasTriggered = new Date();
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }

                    for (let rig of largeOil) {
                        if (Map.getDistance(marker.x, marker.y, rig.x, rig.y) <=
                            OIL_RIG_CHINOOK_47_MAX_DISTANCE) {
                            found = true;
                            let oilRigLocation = Map.getPos(rig.x, rig.y, mapSize);
                            rustplus.activeChinook47s[marker.id].type = 'largeOil';

                            rustplus.sendEvent(
                                rustplus.notificationSettings.heavyScientistCalled,
                                `Heavy Scientists got called to the Large Oil Rig at ${oilRigLocation}.`,
                                rustplus.firstPoll,
                                'large_oil_rig_logo.png');

                            let lockedCrateId = module.exports.getOilRigLockedCrateId(rig.x, rig.y, mapMarkers);

                            if (lockedCrateId !== null) {
                                rustplus.lockedCrateLargeOilRigTimers[lockedCrateId] = new Timer.timer(
                                    module.exports.notifyLockedCrateLargeOpen,
                                    Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
                                    rustplus,
                                    oilRigLocation,
                                    lockedCrateId);
                                rustplus.lockedCrateLargeOilRigTimers[lockedCrateId].start();
                            }

                            rustplus.timeSinceLargeOilRigWasTriggered = new Date();
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }

                    /* Offset that is used to determine if coordinates is outside grid system */
                    let offset = 4 * Map.gridDiameter;

                    /* If coordinates of the marker is located outside the grid system + the offset */
                    if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.chinook47Detected,
                            `Chinook 47 enters the map from ${pos} to drop off Locked Crate.`);
                    }
                    else {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.chinook47Detected,
                            `Chinook 47 located at ${pos}.`);
                    }
                    rustplus.activeChinook47s[marker.id].type = 'crate';
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
                if (Map.getDistance(x, y, marker.x, marker.y) < 100) {
                    return marker.id;
                }
            }
        }

        return null;
    },

    checkChinook47Left: function (rustplus, mapMarkers) {
        let newActiveChinook47Object = new Object();
        for (const [id, content] of Object.entries(rustplus.activeChinook47s)) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.Chinook47) {
                    if (marker.id === parseInt(id)) {
                        /* Chinook 47 marker is still visable on the map */
                        active = true;
                        newActiveChinook47Object[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            type: content.type
                        };
                        break;
                    }
                }
            }

            if (active === false) {
                if (content.type === 'crate') {
                    rustplus.timeSinceChinookWasOut = new Date();
                    rustplus.log('EVENT', `Chinook 47 left the map at ${content.location}.`);
                }
            }
        }
        rustplus.activeChinook47s = JSON.parse(JSON.stringify(newActiveChinook47Object));
    },

    notifyLockedCrateSmallOpen: function (args) {
        args[0].sendEvent(
            args[0].notificationSettings.lockedCrateOilRigUnlocked,
            `Locked Crate at Small Oil Rig at ${args[1]} has been unlocked.`,
            args[0].firstPoll,
            'locked_crate_small_oil_rig_logo.png');

        if (args[0].lockedCrateSmallOilRigTimers.hasOwnProperty(args[2])) {
            delete args[0].lockedCrateSmallOilRigTimers[args[2]]
        }
    },

    notifyLockedCrateLargeOpen: function (args) {
        args[0].sendEvent(
            args[0].notificationSettings.lockedCrateOilRigUnlocked,
            `Locked Crate at Large Oil Rig at ${args[1]} has been unlocked.`,
            args[0].firstPoll,
            'locked_crate_large_oil_rig_logo.png');

        if (args[0].lockedCrateLargeOilRigTimers.hasOwnProperty(args[2])) {
            delete args[0].lockedCrateLargeOilRigTimers[args[2]]
        }
    },
}