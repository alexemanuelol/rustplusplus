const CargoShip = require('./cargoShip.js');
const Explosion = require('./explosion.js');
const LockedCrate = require('./lockedCrate.js');
const OilRig = require('./oilRig.js');
const VendingMachine = require('./vendingMachine.js');

module.exports = {
    inGameEventHandler: function (rustplus, client) {
        //console.log('Pull information: server info, map markers, team info and time.');

        rustplus.getInfo((info) => {
            rustplus.getMapMarkers((mapMarkers) => {
                rustplus.getTeamInfo((teamInfo) => {
                    rustplus.getTime((time) => {
                        module.exports.checkEvents(rustplus, client, info, mapMarkers, teamInfo, time);
                    });
                });
            });
        });
    },

    checkEvents: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        //console.log('Check in-game events.');

        CargoShip.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        Explosion.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        LockedCrate.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        OilRig.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        VendingMachine.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
    },
};