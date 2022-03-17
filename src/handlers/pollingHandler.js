const CargoShip = require('../inGameEvents/cargoShip.js');
const Explosion = require('../inGameEvents/explosion.js');
const LockedCrate = require('../inGameEvents/lockedCrate.js');
const OilRig = require('../inGameEvents/oilRig.js');
const PatrolHelicopter = require('../inGameEvents/patrolHelicopter.js');
const VendingMachine = require('../inGameEvents/vendingMachine.js');

const TimeHandler = require('../handlers/timeHandler.js');
const InformationHandler = require('../handlers/informationHandler.js');
const TeamHandler = require('../handlers/teamHandler.js');

const Map = require('../util/map.js');
const Scrape = require('../util/scrape.js');
const Team = require('../structures/Team');

module.exports = {
    pollingHandler: function (rustplus, client) {
        /* Continuous polling of server info, map markers, team info and time. */
        rustplus.getInfo((info) => {
            if (!rustplus.isResponseValid(info)) return;
            rustplus.getMapMarkers((mapMarkers) => {
                if (!rustplus.isResponseValid(mapMarkers)) return;
                rustplus.getTeamInfo(async (teamInfo) => {
                    if (!rustplus.isResponseValid(teamInfo)) return;
                    rustplus.getTime((time) => {
                        if (!rustplus.isResponseValid(time)) return;

                        if (rustplus.firstPoll) {
                            rustplus.mapSize = Map.getCorrectedMapSize(info.response.info.mapSize);
                            rustplus.team = new Team(teamInfo.response.teamInfo, rustplus);
                        }

                        module.exports.checkEvents(rustplus, client, info, mapMarkers, teamInfo, time);
                        rustplus.firstPoll = false;
                    });
                });
            });
        });
    },

    checkEvents: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check in-game events */
        CargoShip.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        PatrolHelicopter.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        Explosion.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        LockedCrate.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        OilRig.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        VendingMachine.handler(rustplus, client, info, mapMarkers, teamInfo, time);

        let instance = client.readInstanceFile(rustplus.guildId);
        let server = `${rustplus.server}-${rustplus.port}`;

        if (instance.serverList[server].timeTillDay === null && instance.serverList[server].timeTillNight == null) {
            TimeHandler.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        }

        TeamHandler.handler(rustplus, client, teamInfo.response.teamInfo);
        rustplus.team.updateTeam(teamInfo.response.teamInfo);

        InformationHandler.handler(rustplus, client, info, mapMarkers, teamInfo, time);
    },
};