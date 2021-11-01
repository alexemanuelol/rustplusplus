const MapCalc = require('./../util/mapCalculations.js');
const RustPlusTypes = require('./../util/rustplusTypes.js');
const Timer = require('./../util/timer.js');

const LAUNCH_SITE_RADIUS = 250;

/* Default 1 hour respawn time */
const BRADLEY_APC_RESPAWN_TIME_MIN = 60;
const BRADLEY_APC_RESPAWN_TIME_MS = BRADLEY_APC_RESPAWN_TIME_MIN * 60 * 1000;

var currentExplosionsId = [];
var bradleyRespawnTimer = new Timer.timer(notifyBradleyRespawn, BRADLEY_APC_RESPAWN_TIME_MS);

/* Bradley APC respawn notification function */
function notifyBradleyRespawn() {
    /* Notifies when bradley should be respawning */
    console.log('Bradley APC should respawn any second now');
}

module.exports = {
    checkEvent: function (rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new explosion is detected */
        module.exports.checkNewExplosionDetected(rustplus, mapMarkers, info);

        /* Check to see if an Explosion marker have disappeared from the map */
        module.exports.checkExplosionLeft(mapMarkers);
    },

    checkNewExplosionDetected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                if (!currentExplosionsId.includes(marker.id)) {
                    /* New Explosion detected! Save to array of explosions id */
                    currentExplosionsId.push(marker.id);

                    if (module.exports.isExplosionBradley(marker.x, marker.y, rustplus)) {
                        /* Bradley APC */
                        console.log('Bradley APC was destroyed at Launch Site.');
                        bradleyRespawnTimer.restart();
                    }
                    else {
                        /* Patrol Helicopter */
                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize)
                        let loc = (gridLocation === null) ? 'somewhere outside the grid system' : `at ${gridLocation}`;
                        console.log(`Patrol Helicopter was taken down ${loc}.`);
                    }
                }
            }
        }
    },

    checkExplosionLeft: function (mapMarkers) {
        let tempArray = [];
        for (let id of currentExplosionsId) {
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
        currentExplosionsId = JSON.parse(JSON.stringify(tempArray));
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

    getBradleyRespawnTimeLeft: function () {
        /* Returns the time left before the next bradley spawn, if timer is not running, null will be sent back */
        if (bradleyRespawnTimer.getStateRunning()) {
            return Timer.secondsToFullScale(bradleyRespawnTimer.getTimeLeft() / 1000);
        }
        return null;
    },
}

// TODO: Add discord notifications for the events