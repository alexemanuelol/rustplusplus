const Constants = require('../util/eventConstants.js');
const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer');

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        module.exports.checkNewCargoShipDetected(rustplus, info, mapMarkers);

        /* Check to see if a Cargo Ship have disappeared from the map */
        module.exports.checkCargoShipLeft(rustplus, mapMarkers);
    },

    checkNewCargoShipDetected: function (rustplus, info, mapMarkers) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                let mapSize = info.response.info.mapSize;
                let outsidePos = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);
                let gridPos = MapCalc.getGridPos(marker.x, marker.y, mapSize);
                let pos = (gridPos === null) ? outsidePos : gridPos;

                if (!(marker.id in rustplus.activeCargoShips)) {
                    /* New Cargo Ship detected, save it */
                    rustplus.activeCargoShips[marker.id] = {
                        x: marker.x,
                        y: marker.y,
                        location: pos,
                        crates: []
                    };

                    /* Offset that is used to determine if the Cargo Ship just spawned */
                    let offset = 4 * MapCalc.gridDiameter;

                    /* If Cargo Ship is located outside the grid system + the offset */
                    if (MapCalc.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                        let str = `Cargo Ship enters the map from ${pos}.`;
                        let setting = rustplus.notificationSettings.cargoShipDetected;
                        if (setting.discord) {
                            rustplus.sendEvent(str, setting.image);
                        }
                        if (setting.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);

                        rustplus.cargoShipEgressTimers[marker.id] = new Timer.timer(
                            module.exports.notifyCargoShipEgress,
                            Constants.CARGO_SHIP_EGRESS_TIME_MS,
                            rustplus,
                            marker.id);
                        rustplus.cargoShipEgressTimers[marker.id].start();
                    }
                    else {
                        let str = `Cargo Ship located at ${pos}.`;
                        let setting = rustplus.notificationSettings.cargoShipDetected;
                        if (setting.discord) {
                            rustplus.sendEvent(str, setting.image);
                        }
                        if (setting.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.log(str);
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

                let str = `Cargo Ship just left the map at ${content.location}.`;
                let setting = rustplus.notificationSettings.cargoShipLeft;
                if (setting.discord) {
                    rustplus.sendEvent(str, setting.image);
                }
                if (setting.inGame) {
                    rustplus.sendTeamMessage(`Event: ${str}`);
                }
                rustplus.log(str);

                if (rustplus.cargoShipEgressTimers[parseInt(id)]) {
                    rustplus.cargoShipEgressTimers[parseInt(id)].stop();
                    delete rustplus.cargoShipEgressTimers[parseInt(id)];
                }
            }
        }
        rustplus.activeCargoShips = JSON.parse(JSON.stringify(newActiveCargoShipObject));
    },

    notifyCargoShipEgress: function (args) {
        let pos = args[0].activeCargoShips[args[1]].location;
        let str = `Cargo Ship should be in the egress stage at ${pos}.`;
        let setting = args[0].notificationSettings.cargoShipEgress;
        if (setting.discord) {
            args[0].sendEvent(str, setting.image);
        }
        if (setting.inGame) {
            args[0].sendTeamMessage(`Event: ${str}`);
        }
        args[0].log(str);
    },
}