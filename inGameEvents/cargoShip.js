const MapCalc = require('../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');
const Timer = require('../util/timer.js');

/* Default 50 minutes before egress start */
const CARGO_SHIP_EGRESS_TIME_MIN = 50;
const CARGO_SHIP_EGRESS_TIME_MS = CARGO_SHIP_EGRESS_TIME_MIN * 60 * 1000;

var currentCargoShipsId = [];
var cargoShipEgressTimer = new Timer.timer(notifyCargoShipEgress, CARGO_SHIP_EGRESS_TIME_MS);

/* Cargo Ship egress notification function */
function notifyCargoShipEgress() {
    /* Notifies when the Cargo Ship should be in the egress stage */
    console.log('Cargo Ship should be in the egress stage.');
}

module.exports = {
    checkEvent: function (rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        module.exports.checkNewCargoShipDetected(mapMarkers, info);

        /* Check to see if a Cargo Ship have disappeared from the map */
        module.exports.checkCargoShipLeft(mapMarkers);

        /* Clear timer if no active Cargo Ships */
        if (currentCargoShipsId.length === 0) {
            cargoShipEgressTimer.stop();
        }
    },

    checkNewCargoShipDetected: function (mapMarkers, info) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                if (!currentCargoShipsId.includes(marker.id)) {
                    /* New Cargo Ship detected! Save to array of CargoShips id */
                    currentCargoShipsId.push(marker.id);

                    let mapSize = info.response.info.mapSize;
                    let spawnLocation = MapCalc.getCoordinatesOrientation(marker.x, marker.y, mapSize);

                    /* Offset that is used to determine if the Cargo Ship just spawned */
                    let offset = 4 * MapCalc.gridDiameter;

                    /* If Cargo Ship is located outside the grid system + the offset */
                    if (marker.x < -offset || marker.x > (mapSize + offset) ||
                        marker.y < -offset || marker.y > (mapSize + offset)) {
                        console.log(`Cargo Ship enters the map from ${spawnLocation}`);
                        cargoShipEgressTimer.restart();
                    }
                    else {
                        console.log(`Cargo Ship located at ${spawnLocation}`);
                    }
                }
            }
        }
    },

    checkCargoShipLeft: function (mapMarkers) {
        let tempArray = [];
        for (let id of currentCargoShipsId) {
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
        currentCargoShipsId = JSON.parse(JSON.stringify(tempArray));
    },

    getCargoShipEgressTimeLeft: function () {
        /* Returns the time left before the Cargo Ship enters the egress stage,
        if timer is not running, null will be sent back */
        if (cargoShipEgressTimer.getStateRunning()) {
            return Timer.secondsToFullScale(cargoShipEgressTimer.getTimeLeft() / 1000);
        }
        return null;
    },
}

// TODO: Add discord notifications for the events