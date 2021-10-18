const CargoShip = require('./cargoShip.js');
const Explosion = require('./explosion.js');
const LockedCrate = require('./lockedCrate.js');
const OilRig = require('./oilRig.js');
const VendingMachine = require('./vendingMachine.js');

module.exports = {
    inGameEventHandler: function (discord, rustplus) {
        //console.log('Pull information: server info, map markers, team info and time.');

        rustplus.getInfo((info) => {
            rustplus.getMapMarkers((mapMarkers) => {
                rustplus.getTeamInfo((teamInfo) => {
                    rustplus.getTime((time) => {
                        module.exports.checkEvents(discord, rustplus, info, mapMarkers, teamInfo, time);
                    });
                });
            });
        });
    },

    checkEvents: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        //console.log('Check in-game events.');

        CargoShip.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        Explosion.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        LockedCrate.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        OilRig.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        VendingMachine.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
    },
};