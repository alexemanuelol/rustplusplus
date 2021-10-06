const CargoShip = require('./cargoShip.js');
const Chinook47 = require('./chinook47.js');
const Explosion = require('./explosion.js');
const LargeOilRig = require('./largeOilRig.js');
const SmallOilRig = require('./smallOilRig.js');
const VendingMachine = require('./vendingMachine.js');

module.exports = {
    inGameEventHandler: function (discord, rustplus) {
        console.log('Pull information: server info, map markers, team info and time.');

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
        console.log('Check in-game events.');

        CargoShip.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        Chinook47.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        Explosion.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        LargeOilRig.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        SmallOilRig.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
        VendingMachine.checkEvent(discord, rustplus, info, mapMarkers, teamInfo, time);
    },
};