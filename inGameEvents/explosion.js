const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

const LAUNCH_SITE_RADIUS = 250;

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
                if (!rustplus.currentExplosionsId.includes(marker.id)) {
                    /* New Explosion detected! Save to array of explosions id */
                    rustplus.currentExplosionsId.push(marker.id);

                    if (module.exports.isExplosionBradley(marker.x, marker.y, rustplus)) {
                        if (rustplus.notificationSettings.bradleyApcDestroyed) {
                            rustplus.sendEvent('Bradley APC was destroyed at Launch Site.');
                        }
                        rustplus.bradleyRespawnTimer.restart();
                    }
                    else {
                        /* Patrol Helicopter */
                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize)
                        let loc = (gridLocation === null) ? 'somewhere outside the grid system' : `at ${gridLocation}`;
                        if (rustplus.notificationSettings.patrolHelicopterDowned) {
                            rustplus.sendEvent(`Patrol Helicopter was taken down ${loc}.`);
                        }
                    }
                }
            }
        }
    },

    checkExplosionLeft: function (rustplus, mapMarkers) {
        let tempArray = [];
        for (let id of rustplus.currentExplosionsId) {
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                    if (marker.id === id) {
                        /* Explosion marker is still visable on the map */
                        tempArray.push(id);
                        break;
                    }
                }
            }
        }
        rustplus.currentExplosionsId = JSON.parse(JSON.stringify(tempArray));
    },

    isExplosionBradley: function (x, y, rustplus) {
        /* Check where the explosion marker is located, if near Launch Site, it assumes bradley */
        for (let monument of rustplus.mapMonuments) {
            if (monument.token === 'launchsite') {
                return (MapCalc.getDistance(x, y, monument.x, monument.y) <= LAUNCH_SITE_RADIUS);
            }
        }
        return false;
    },

    notifyBradleyRespawn: function (rustplus) {
        if (rustplus[0].notificationSettings.bradleyApcShouldRespawn) {
            rustplus[0].sendEvent('Bradley APC should respawn any second now');
        }
    },
}