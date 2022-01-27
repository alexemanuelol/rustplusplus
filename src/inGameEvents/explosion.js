const Constants = require('../util/eventConstants.js');
const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer');

const PATROL_HELI_DOWNED_RADIUS = 400;

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new explosion is detected */
        module.exports.checkNewExplosionDetected(rustplus, mapMarkers, info);

        /* Check to see if an Explosion marker have disappeared from the map */
        module.exports.checkExplosionLeft(rustplus, mapMarkers);
    },

    checkNewExplosionDetected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                let mapSize = info.response.info.mapSize;
                let outsidePos = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);
                let gridPos = MapCalc.getGridPos(marker.x, marker.y, mapSize);
                let pos = (gridPos === null) ? outsidePos : gridPos;

                if (!(marker.id in rustplus.activeExplosions)) {
                    /* New Explosion detected, save it */
                    rustplus.activeExplosions[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos
                    };

                    let isExplosionMarkerHeli = false;
                    if (rustplus.patrolHelicoptersLeft.length !== 0) {
                        for (let heli of rustplus.patrolHelicoptersLeft) {
                            if (MapCalc.getDistance(marker.x, marker.y, heli.x, heli.y) <=
                                PATROL_HELI_DOWNED_RADIUS) {
                                isExplosionMarkerHeli = true;
                                delete rustplus.activePatrolHelicopters[heli.id]

                                rustplus.patrolHelicoptersLeft = rustplus.patrolHelicoptersLeft.filter(e =>
                                    e.x !== heli.x &&
                                    e.y !== heli.y);
                            }
                        }
                    }

                    if (isExplosionMarkerHeli) {
                        /* Patrol Helicopter just got downed */
                        let str = `Patrol Helicopter was taken down ${pos}.`;
                        let setting = rustplus.notificationSettings.patrolHelicopterDestroyed;
                        if (setting.discord) {
                            rustplus.sendEvent(str, setting.image);
                        }
                        if (setting.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }
                    else {
                        /* Bradley APC just got destroyed */
                        let str = 'Bradley APC was destroyed at Launch Site.';
                        let setting = rustplus.notificationSettings.bradleyApcDestroyed;
                        if (setting.discord) {
                            rustplus.sendEvent(str, setting.image);
                        }
                        if (setting.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);

                        rustplus.bradleyRespawnTimers[marker.id] = new Timer.timer(
                            module.exports.notifyBradleyRespawn,
                            Constants.BRADLEY_APC_RESPAWN_TIME_MS,
                            rustplus);
                        rustplus.bradleyRespawnTimers[marker.id].start();
                    }
                }
                else {
                    /* Update Explosion position */
                    rustplus.activeExplosions[marker.id].x = marker.x;
                    rustplus.activeExplosions[marker.id].y = marker.y;
                    rustplus.activeExplosions[marker.id].location = pos;
                }
            }
        }
    },

    checkExplosionLeft: function (rustplus, mapMarkers) {
        let newActiveExplosionsObject = new Object();
        for (const [id, content] of Object.entries(rustplus.activeExplosions)) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                    if (marker.id === parseInt(id)) {
                        /* Explosion marker is still visable on the map */
                        active = true;
                        newActiveExplosionsObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location
                        };
                        break;
                    }
                }
            }

            if (active === false) {
                if (rustplus.bradleyRespawnTimers[parseInt(id)]) {
                    rustplus.bradleyRespawnTimers[parseInt(id)].stop();
                    delete rustplus.bradleyRespawnTimers[parseInt(id)];
                }
            }
        }
        rustplus.activeExplosions = JSON.parse(JSON.stringify(newActiveExplosionsObject));
    },

    notifyBradleyRespawn: function (args) {
        let str = 'Bradley APC should respawn any second now.';
        let setting = args[0].notificationSettings.bradleyApcShouldRespawn;
        if (setting.discord) {
            args[0].sendEvent(str, setting.image);
        }
        if (setting.inGame) {
            args[0].sendTeamMessage(`Event: ${str}`);
        }
        args[0].log(str);
    },
}