const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Patrol Helicopter is detected */
        module.exports.checkNewPatrolHelicopterDetected(rustplus, mapMarkers, info);

        /* Check to see if a Patrol Helicopter have disappeared from the map */
        module.exports.checkPatrolHelicopterLeft(rustplus, mapMarkers);
    },

    checkNewPatrolHelicopterDetected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type > 6 || marker.type < 1) {
                console.log(`New Heli map marker type?: ${marker.type}`);
            }
            if (marker.type === RustPlusTypes.MarkerType.PatrolHelicopter) {
                let mapSize = info.response.info.mapSize;
                let outsidePos = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);
                let gridPos = MapCalc.getGridPos(marker.x, marker.y, mapSize);
                let pos = (gridPos === null) ? outsidePos : gridPos;

                if (!(marker.id in rustplus.activePatrolHelicopters)) {
                    /* New Patrol Helicopter detected, save it */
                    rustplus.activePatrolHelicopters[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos
                    };

                    /* Offset that is used to determine if the Patrol Helicopter just spawned */
                    let offset = 4 * MapCalc.gridDiameter;

                    /* If Patrol Helicopter is located outside the grid system + the offset */
                    if (MapCalc.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        let str = `Patrol Helicopter enters the map from ${pos}.`;
                        if (rustplus.notificationSettings.patrolHelicopterDetected.discord) {
                            rustplus.sendEvent(str, 'patrol_helicopter_logo.png');
                        }
                        if (rustplus.notificationSettings.patrolHelicopterDetected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
                    }
                    else {
                        let str = `Patrol Helicopter located at ${pos}.`;
                        if (rustplus.notificationSettings.patrolHelicopterDetected.discord) {
                            rustplus.sendEvent(str, 'patrol_helicopter_logo.png');
                        }
                        if (rustplus.notificationSettings.patrolHelicopterDetected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
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
                    let str = `Patrol Helicopter just left the map at ${content.location}.`;
                    if (rustplus.notificationSettings.patrolHelicopterLeft.discord) {
                        rustplus.sendEvent(str, 'cargoship_logo.png');
                    }
                    if (rustplus.notificationSettings.patrolHelicopterLeft.inGame) {
                        rustplus.sendTeamMessage(`Event: ${str}`);
                    }
                    rustplus.log(str);
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