const MapCalc = require('./../utils/mapCalculations.js');
const RustPlusTypes = require('./../utils/rustplusTypes.js');
const Timer = require('./../utils/timer.js');

var currentCargoShipsId = [];
var cargoShipEgressTimer = null;
const CARGO_SHIP_EGRESS_TIME_MS = 50 * 60 * 1000; /* Default 50 minutes before egress start */

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new Cargo Ship is detected */
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                if (!currentCargoShipsId.includes(marker.id)) {
                    /* New Cargo Ship detected! Save to array of CargoShips id */
                    currentCargoShipsId.push(marker.id);

                    let mapSize = info.response.info.mapSize;
                    let spawnLocation = module.exports.getCargoShipSpawnLocation(marker.x, marker.y, mapSize);

                    let offset = 4 * MapCalc.gridDiameter;

                    /* If Cargo Ship is located outside the grid system + the offset */
                    if (marker.x < -offset || marker.x > (mapSize + offset) ||
                        marker.y < -offset || marker.y > (mapSize + offset)) {
                        console.log('Cargo Ship enters the map from ' + spawnLocation);
                        module.exports.restartCargoShipEgressTimer();
                    }
                    else {
                        console.log('Cargo Ship located at ' + spawnLocation);
                    }
                }
            }
        }

        /* Check to see if a Cargo Ship have disappeared from the map */
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
        currentCargoShipsId = tempArray.slice();

        /* Clear timer if no active Cargo Ships */
        if (currentCargoShipsId.length === 0) {
            module.exports.clearCargoShipEgressTimerVariable();
        }
    },

    restartCargoShipEgressTimer: function () {
        module.exports.clearCargoShipEgressTimerVariable();

        /* Start a new timer for the Cargo Ship */
        cargoShipEgressTimer = new Timer.timer(module.exports.notifyCargoShipEgress, CARGO_SHIP_EGRESS_TIME_MS);
    },

    clearCargoShipEgressTimerVariable: function () {
        if (cargoShipEgressTimer !== null) {
            cargoShipEgressTimer.stop();
            cargoShipEgressTimer = null;
        }
    },

    getCargoShipSpawnLocation: function (x, y, size) {
        /* Returns a number representing at what location Cargo Ship was located */
        let offset = size / 6;
        let dir;

        /* Vertically */
        if (y < offset) {
            dir = 0;
        }
        else if (y > (offset * 5)) {
            dir = 3;
        }
        else {
            if (x < (offset * 3))
                return module.exports.locations[6];
            else
                return module.exports.locations[7];
        }

        /* Horizontally */
        if (x < offset) {
            dir += 0;
        }
        else if (x > (offset * 5)) {
            dir += 2;
        }
        else {
            dir += 1;
        }

        return module.exports.locations[dir];
    },

    locations: {
        0: 'South West',
        1: 'the South',
        2: 'South East',
        3: 'North West',
        4: 'the North',
        5: 'North East',
        6: 'the West',
        7: 'the East'
    },

    getCargoShipTimeLeftBeforeEgress: function () {
        /* Returns the time left before the Cargo Ship enters the egress stage, if no timer, null will be sent back */
        if (cargoShipEgressTimer !== null) {
            let time = cargoShipEgressTimer.getTimeLeft() / 1000;
            return Timer.secondsToFullScale(time);
        }
        return null;
    },

    notifyCargoShipEgress: function () {
        /* Notifies when the Carho Ship should be in the egress stage */
        console.log('Cargo Ship should be in the egress stage.');
        module.exports.clearCargoShipEgressTimerVariable();
    },
}

// TODO: Add discord notifications for the events