const Main = require('./../index.js');
const MapCalc = require('./../utils/mapCalculations.js');
const RustPlusTypes = require('./../utils/rustplusTypes.js');

var currentExplosionsId = [];
const LAUNCH_SITE_RADIUS = 250;

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new explosion is detected */
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.Explosion) {
                if (!currentExplosionsId.includes(marker.id)) {
                    /* New Explosion detected! Save to array of explosions */
                    currentExplosionsId.push(marker.id);

                    if (module.exports.isExplosionBradley(marker.x, marker.y)) {
                        /* Bradley APC */
                        console.log('Bradley APC was destroyed at Launch Site.');
                    }
                    else {
                        /* Patrol Helicopter */
                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize)
                        console.log('Patrol Helicopter was taken down at ' + gridLocation);
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
}

// TODO: Add discord notifications for the events