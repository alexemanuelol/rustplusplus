const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

module.exports = {
    checkEvent: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        module.exports.checkNewCargoShipDetected(rustplus, mapMarkers, info);

        /* Check to see if a Cargo Ship have disappeared from the map */
        module.exports.checkCargoShipLeft(rustplus, mapMarkers);

        /* Clear timer if no active Cargo Ships */
        if (rustplus.currentCargoShipsId.length === 0) {
            rustplus.cargoShipEgressTimer.stop();
        }
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
                        console.log(`Cargo Ship enters the map from ${spawnLocation}`);
                        rustplus.cargoShipEgressTimer.restart();
                    }
                    else {
                        console.log(`Cargo Ship located at ${spawnLocation}`);
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
                console.log('Cargo Ship just left the map');
            }
        }
        rustplus.currentCargoShipsId = JSON.parse(JSON.stringify(tempArray));
    },

    notifyCargoShipEgress: function () {
        /* Notifies when the Cargo Ship should be in the egress stage */
        console.log('Cargo Ship should be in the egress stage.');
    },
}

// TODO: Add discord notifications for the events