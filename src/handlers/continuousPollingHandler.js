const CargoShip = require('../inGameEvents/cargoShip.js');
const Explosion = require('../inGameEvents/explosion.js');
const LockedCrate = require('../inGameEvents/lockedCrate.js');
const OilRig = require('../inGameEvents/oilRig.js');
const PatrolHelicopter = require('../inGameEvents/patrolHelicopter.js');
const VendingMachine = require('../inGameEvents/vendingMachine.js');

const Time = require('../inGameEvents/time.js');
const Information = require('../inGameEvents/information.js');

module.exports = {
    continuousPollingHandler: function (rustplus, client) {
        /* Continuous polling of server info, map markers, team info and time. */
        rustplus.getInfo((info) => {
            if (!rustplus.isResponseValid(info)) return;
            rustplus.getMapMarkers((mapMarkers) => {
                if (!rustplus.isResponseValid(mapMarkers)) return;
                rustplus.getTeamInfo((teamInfo) => {
                    if (!rustplus.isResponseValid(teamInfo)) return;
                    rustplus.getTime((time) => {
                        if (!rustplus.isResponseValid(time)) return;

                        module.exports.checkEvents(rustplus, client, info, mapMarkers, teamInfo, time);
                        rustplus.firstPoll = false;
                    });
                });
            });
        });
    },

    checkEvents: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check in-game events */
        CargoShip.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        PatrolHelicopter.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        Explosion.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        LockedCrate.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        OilRig.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        VendingMachine.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);

        let instance = client.readInstanceFile(rustplus.guildId);
        let server = `${rustplus.server}-${rustplus.port}`;

        if (instance.serverList[server].timeTillDay === null && instance.serverList[server].timeTillNight == null) {
            Time.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
        }

        Information.checkEvent(rustplus, client, info, mapMarkers, teamInfo, time);
    },
};