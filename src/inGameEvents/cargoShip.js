const Constants = require('../util/eventConstants.js');
const Map = require('../util/map.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer');

module.exports = {
    handler: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        module.exports.checkNewCargoShipDetected(rustplus, info, mapMarkers);

        /* Check to see if a Cargo Ship have disappeared from the map */
        module.exports.checkCargoShipLeft(rustplus, mapMarkers);
    },

    checkNewCargoShipDetected: function (rustplus, info, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                let mapSize = Map.getCorrectedMapSize(info.response.info.mapSize);
                let pos = Map.getPos(marker.x, marker.y, mapSize);

                if (!(marker.id in rustplus.activeCargoShips)) {
                    /* New Cargo Ship detected, save it */
                    rustplus.activeCargoShips[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos,
                        crates: []
                    };

                    /* Offset that is used to determine if the Cargo Ship just spawned */
                    let offset = 4 * Map.gridDiameter;

                    /* If Cargo Ship is located outside the grid system + the offset */
                    if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.cargoShipDetected,
                            `Cargo Ship enters the map from ${pos}.`);

                        rustplus.cargoShipEgressTimers[marker.id] = new Timer.timer(
                            module.exports.notifyCargoShipEgress,
                            Constants.CARGO_SHIP_EGRESS_TIME_MS,
                            rustplus,
                            marker.id);
                        rustplus.cargoShipEgressTimers[marker.id].start();
                    }
                    else {
                        rustplus.sendEvent(
                            rustplus.notificationSettings.cargoShipDetected,
                            `Cargo Ship located at ${pos}.`);
                    }
                }
                else {
                    /* Update Cargo Ship position */
                    rustplus.activeCargoShips[marker.id].x = marker.x;
                    rustplus.activeCargoShips[marker.id].y = marker.y;
                    rustplus.activeCargoShips[marker.id].location = pos;
                }
            }
        }
    },

    checkCargoShipLeft: function (rustplus, mapMarkers) {
        let newActiveCargoShipObject = new Object();
        for (const [id, content] of Object.entries(rustplus.activeCargoShips)) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                    if (marker.id === parseInt(id)) {
                        /* Cargo Ship marker is still visable on the map */
                        active = true;
                        newActiveCargoShipObject[parseInt(id)] = {
                            x: content.x,
                            y: content.y,
                            location: content.location,
                            crates: content.crates
                        };
                        break;
                    }
                }
            }

            if (active === false) {
                /* Remove Locked Crates that are associated with the Cargo Ship */
                for (let crateId of content.crates) {
                    if (rustplus.activeLockedCrates.hasOwnProperty(crateId)) {
                        delete rustplus.activeLockedCrates[crateId];
                    }
                }

                rustplus.sendEvent(
                    rustplus.notificationSettings.cargoShipLeft,
                    `Cargo Ship just left the map at ${content.location}.`);

                if (rustplus.cargoShipEgressTimers[parseInt(id)]) {
                    rustplus.cargoShipEgressTimers[parseInt(id)].stop();
                    delete rustplus.cargoShipEgressTimers[parseInt(id)];
                }

                rustplus.timeSinceCargoWasOut = new Date();
            }
        }
        rustplus.activeCargoShips = JSON.parse(JSON.stringify(newActiveCargoShipObject));
    },

    notifyCargoShipEgress: function (args) {
        let pos = args[0].activeCargoShips[args[1]].location;
        args[0].sendEvent(
            args[0].notificationSettings.cargoShipEgress,
            `Cargo Ship should be in the egress stage at ${pos}.`);

        if (args[0].cargoShipEgressTimers[args[1]]) {
            args[0].cargoShipEgressTimers[args[1]].stop();
            delete args[0].cargoShipEgressTimers[args[1]];
        }
    }
}