const Main = require('./../index.js');
const MapCalc = require('./../utils/mapCalculations.js');
const RustPlusTypes = require('./../utils/rustplusTypes.js');
const Timer = require('./../utils/timer.js');

const LAUNCH_SITE_RADIUS = 250;
const BRADLEY_APC_RESPAWN_TIME_MS = 60 * 60 * 1000; /* Default 1 hour respawn time */

var currentExplosionsId = [];
var bradleyRespawnTimer = new Timer.timer(notifyBradleyRespawn, BRADLEY_APC_RESPAWN_TIME_MS);

/* Bradley APC respawn notification function */
function notifyBradleyRespawn() {
    /* Notifies when bradley should be respawning */
    console.log('Bradley APC should respawn any second now');
    bradleyRespawnTimer.stop();
}

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new explosion is detected */
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                if (!currentExplosionsId.includes(marker.id)) {
                    /* New Explosion detected! Save to array of explosions id */
                    currentExplosionsId.push(marker.id);

                    if (module.exports.isExplosionBradley(marker.x, marker.y)) {
                        /* Bradley APC */
                        console.log('Bradley APC was destroyed at Launch Site.');
                        bradleyRespawnTimer.restart();
                    }
                    else {
                        /* Patrol Helicopter */
                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize)
                        let loc = (gridLocation === null) ? 'somewhere outside the grid system' : 'at ' + gridLocation;
                        console.log('Patrol Helicopter was taken down ' + loc + '.');
                    }
                }
            }
        }

        /* Check to see if an Explosion marker have disappeared from the map */
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

    isExplosionBradley: function (x, y) {
        /* Check where the explosion marker is located, if near Launch Site, it assumes bradley */
        for (let monument of Main.mapMonuments) {
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