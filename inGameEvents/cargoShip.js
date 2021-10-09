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
                    let spawnDirNumber = module.exports.getCargoShipSpawnLocation(marker.x, marker.y, mapSize);
                    let spawnDir = module.exports.locations[spawnDirNumber];

                    let offset = (mapSize / 6) * 0.85

                    if (marker.x < -offset || marker.x > (mapSize + offset) ||
                        marker.y < -offset || marker.y > (mapSize + offset)) {
                        if (module.exports.isCargoShipEntering(marker.rotation, spawnDirNumber)) {
                            console.log('Cargo Ship enters the map from ' + spawnDir);
                            cargoShipEgressTimer = new Timer.timer(module.exports.notifyCargoShipEgress,
                                CARGO_SHIP_EGRESS_TIME_MS);
                        }
                        else {
                            console.log('Cargo Ship is just about to leave the map at ' + spawnDir);
                        }
                    }
                    else {
                        console.log('Cargo Ship located at ' + spawnDir);
                    }
                }
            }
        }

        /* Check to see if a Cargo Ship have disappeared from the map */
        let tempArray = [];
        for (let id of currentCargoShipsId) {
            for (let marker of mapMarkers.response.mapMarkers.markers) {
                if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
                    if (marker.id === id) {
                        /* Cargo Ship is still visable on the map */
                        tempArray.push(id);
                        break;
                    }
                }
            }
        }
        currentCargoShipsId = tempArray.slice();

        /* Clear timer if no active Cargo Ships */
        if (currentCargoShipsId.length === 0) {
            if (cargoShipEgressTimer !== null) {
                cargoShipEgressTimer.stop();
                cargoShipEgressTimer = null;
            }
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
                return 6;
            else
                return 7;
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

        return dir;
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

    rotationOfEnteringCargoShip: {
        0: 315,
        1: 0,
        2: 45,
        3: 225,
        4: 180,
        5: 135,
        6: 270,
        7: 90
    },

    isCargoShipEntering: function (rotation, enteringLocation) {
        /* Decides if the Cargo Ship is entering the map or leaving the map by checking its current rotation */
        let lower = module.exports.rotationOfEnteringCargoShip[enteringLocation] - 45;
        if (lower < 0) {
            lower += 360;
        }

        let upper = module.exports.rotationOfEnteringCargoShip[enteringLocation] + 45;
        if (upper > 360) {
            upper -= 360;
        }

        if (lower <= upper) {
            return (rotation >= lower && rotation <= upper)
        }
        else {
            return (rotation >= lower || rotation <= upper)
        }
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
        cargoShipEgressTimer.stop();
        cargoShipEgressTimer = null;
    },
}

// TODO: Add discord notifications for the events