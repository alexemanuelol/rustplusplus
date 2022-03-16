const Map = require('../util/map.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

module.exports = {
    handler: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Patrol Helicopter is detected */
        module.exports.checkNewPatrolHelicopterDetected(rustplus, mapMarkers, info);

        /* Check to see if a Patrol Helicopter have disappeared from the map */
        module.exports.checkPatrolHelicopterLeft(rustplus, mapMarkers);
    },

    checkNewPatrolHelicopterDetected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.PatrolHelicopter) {
                let mapSize = Map.getCorrectedMapSize(info.response.info.mapSize);
                let pos = Map.getPos(marker.x, marker.y, mapSize);

                if (!(marker.id in rustplus.activePatrolHelicopters)) {
                    /* New Patrol Helicopter detected, save it */
                    rustplus.activePatrolHelicopters[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos
                    };

                    /* Offset that is used to determine if the Patrol Helicopter just spawned */
                    let offset = 4 * Map.gridDiameter;

                    /* If Patrol Helicopter is located outside the grid system + the offset */
                    if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.patrolHelicopterDetected,
                            `Patrol Helicopter enters the map from ${pos}.`);
                    }
                    else {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.patrolHelicopterDetected,
                            `Patrol Helicopter located at ${pos}.`);
                    }
                }
                else {
                    /* Update Patrol Helicopter position */
                    rustplus.activePatrolHelicopters[marker.id].x = marker.x;
                    rustplus.activePatrolHelicopters[marker.id].y = marker.y;
                    rustplus.activePatrolHelicopters[marker.id].location = pos;
                }
            }
        }
    },

    checkPatrolHelicopterLeft: function (rustplus, mapMarkers) {
        let newActivePatrolHelicoptersObject = new Object();
        for (const [id, content] of Object.entries(rustplus.activePatrolHelicopters)) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.PatrolHelicopter) {
                    if (marker.id === parseInt(id)) {
                        /* Patrol Helicopter marker is still visable on the map */
                        active = true;
                        newActivePatrolHelicoptersObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location
                        };
                        break;
                    }
                }
            }

            if (active === false) {
                if (content.fakeLeft && content.stage === 1) {
                    /* Add it with fakeLeft, in case it left the map rather than got downed */
                    newActivePatrolHelicoptersObject[parseInt(id)] = {
                        x: content.x,
                        y: content.y,
                        location: content.location,
                        fakeLeft: true,
                        stage: 2
                    };
                }
                else if (content.fakeLeft && content.stage === 2) {
                    rustplus.sendEvent(
                        rustplus.notificationSettings.patrolHelicopterLeft,
                        `Patrol Helicopter just left the map at ${content.location}.`);

                    rustplus.timeSinceHeliWasOnMap = new Date();
                }
                else {
                    rustplus.patrolHelicoptersLeft.push({
                        id: parseInt(id),
                        location: content.location,
                        x: content.x,
                        y: content.y
                    });

                    /* Add it with fakeLeft, in case it left the map rather than got downed */
                    newActivePatrolHelicoptersObject[parseInt(id)] = {
                        x: content.x,
                        y: content.y,
                        location: content.location,
                        fakeLeft: true,
                        stage: 1
                    };
                }
            }
        }
        rustplus.activePatrolHelicopters = JSON.parse(JSON.stringify(newActivePatrolHelicoptersObject));
    }
}