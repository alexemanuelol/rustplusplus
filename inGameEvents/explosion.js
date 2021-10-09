const Main = require('./../index.js');
const MapCalc = require('./../utils/mapCalculations.js');
const RustPlusTypes = require('./../utils/rustplusTypes.js');
const Timer = require('./../utils/timer.js');

var currentExplosionsId = [];
var bradleyRespawnTimer = null;
const LAUNCH_SITE_RADIUS = 250;
const BRADLEY_APC_RESPAWN_TIME_MS = 60 * 60 * 1000; /* Default 1 hour respawn time */

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
                        bradleyRespawnTimer = new Timer.timer(module.exports.notifyBradleyRespawn,
                            BRADLEY_APC_RESPAWN_TIME_MS);
                    }
                    else {
                        /* Patrol Helicopter */
                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize)
                        let loc = (gridLocation === null) ? 'somewhere outside the grid system' : 'at ' + gridLocation;
                        console.log('Patrol Helicopter was taken down ' + loc + ".");
                    }
                }
            }
        }

        /* Check to see if an explosion marker have disappeared from the map */
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
        currentExplosionsId = tempArray.slice();
    },

    isExplosionBradley: function (x, y) {
        /* Check where the explosion marker is located, if near Launch Site, it assumes bradley */
        let launchCordX = null;
        let launchCordY = null;
        for (let monument of Main.mapMonuments) {
            if (monument.token === 'launchsite') {
                launchCordX = monument.x;
                launchCordY = monument.y;
            }
        }

        return (MapCalc.getDistance(x, y, launchCordX, launchCordY) <= LAUNCH_SITE_RADIUS)
    },

    getBradleyRespawnTimeLeft: function () {
        /* Returns the time left before the next bradley spawn, if no timer, null will be sent back */
        if (bradleyRespawnTimer !== null) {
            let time = bradleyRespawnTimer.getTimeLeft() / 1000;
            return Timer.secondsToFullScale(time);
        }
        return null;
    },

    notifyBradleyRespawn: function () {
        /* Notifies when bradley should be respawning */
        console.log('Bradley APC should respawn any second now');
        bradleyRespawnTimer.stop();
        bradleyRespawnTimer = null;
    },
}

// TODO: Add discord notifications for the events