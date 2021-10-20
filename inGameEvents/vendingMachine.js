const MapCalc = require('./../utils/mapCalculations.js');
const RustPlusTypes = require('../utils/rustplusTypes.js');

var currentVendingMachines = [];

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        /* Check if new Vending Machine is detected */
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.VendingMachine) {
                if (!currentVendingMachines.some(e => e.x === marker.x && e.y === marker.y)) {
                    currentVendingMachines.push({ x: marker.x, y: marker.y });

                    let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize);

                    console.log('New Vending Machine located at ' + gridLocation);
                }
            }
        }
    },

    clearVendingMachines: function () {
        currentVendingMachines = [];
    },
}