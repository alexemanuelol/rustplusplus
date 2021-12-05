const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        module.exports.checkNewCargoShipDetected(rustplus, mapMarkers, info);

        /* Check to see if a Cargo Ship have disappeared from the map */
        module.exports.checkCargoShipLeft(rustplus, mapMarkers);
    },

    checkNewCargoShipDetected: function (rustplus, mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                if (!rustplus.currentCargoShipsId.includes(marker.id)) {
                    /* New Cargo Ship detected! Save to array of CargoShips id */
                    rustplus.currentCargoShipsId.push(marker.id);

                    let mapSize = info.response.info.mapSize;
                    let spawnLocation = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);

                    /* Offset that is used to determine if the Cargo Ship just spawned */
                    let offset = 4 * MapCalc.gridDiameter;

                    /* If Cargo Ship is located outside the grid system + the offset */
                    if (marker.x < -offset || marker.x > (mapSize + offset) ||
                        marker.y < -offset || marker.y > (mapSize + offset)) {
                        let str = `Cargo Ship enters the map from ${spawnLocation}`;
                        if (rustplus.notificationSettings.cargoShipDetected.discord) {
                            rustplus.sendEvent(str);
                        }
                        if (rustplus.notificationSettings.cargoShipDetected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                        rustplus.cargoShipEgressTimer.restart();
                    }
                    else {
                        let str = `Cargo Ship located at ${spawnLocation}`;
                        if (rustplus.notificationSettings.cargoShipDetected.discord) {
                            rustplus.sendEvent(str);
                        }
                        if (rustplus.notificationSettings.cargoShipDetected.inGame) {
                            rustplus.sendTeamMessage(`Event: ${str}`);
                        }
                    }
                }
            }
        }
    },

    checkCargoShipLeft: function (rustplus, mapMarkers) {
        let tempArray = [];
        for (let id of rustplus.currentCargoShipsId) {
            let active = false;
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                    if (marker.id === id) {
                        /* Cargo Ship is still visable on the map */
                        active = true;
                        tempArray.push(id);
                        break;
                    }
                }
            }

            if (active === false) {
                let str = 'Cargo Ship just left the map';
                if (rustplus.notificationSettings.cargoShipLeft.discord) {
                    rustplus.sendEvent(str);
                }
                if (rustplus.notificationSettings.cargoShipLeft.inGame) {
                    rustplus.sendTeamMessage(`Event: ${str}`);
                }
                rustplus.cargoShipEgressTimer.stop();
            }
        }
        rustplus.currentCargoShipsId = JSON.parse(JSON.stringify(tempArray));
    },

    notifyCargoShipEgress: function (rustplus) {
        let str = 'Cargo Ship should be in the egress stage.';
        if (rustplus[0].notificationSettings.cargoShipEgress.discord) {
            rustplus[0].sendEvent(str);
        }
        if (rustplus[0].notificationSettings.cargoShipEgress.inGame) {
            rustplus[0].sendTeamMessage(`Event: ${str}`);
        }
    },
}