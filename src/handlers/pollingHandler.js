const CargoShip = require('../inGameEvents/cargoShip.js');
const PatrolHelicopter = require('../inGameEvents/patrolHelicopter.js');
const Explosion = require('../inGameEvents/explosion.js');
const LockedCrate = require('../inGameEvents/lockedCrate.js');
const OilRig = require('../inGameEvents/oilRig.js');
const VendingMachine = require('../inGameEvents/vendingMachine.js');

const SwitchHandler = require('../handlers/switchHandler.js');
const TimeHandler = require('../handlers/timeHandler.js');
const TeamHandler = require('../handlers/teamHandler.js');
const InformationHandler = require('../handlers/informationHandler.js');

const Map = require('../util/map.js');
const Time = require('../structures/Time');
const Team = require('../structures/Team');
const Info = require('../structures/Info');

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
                            rustplus.time = new Time(time.response.time, rustplus, client);
                            rustplus.team = new Team(teamInfo.response.teamInfo, rustplus);
                            rustplus.info = new Info(info.response.info);
                        }

                        module.exports.handlers(rustplus, client, info, mapMarkers, teamInfo, time);
                        rustplus.firstPoll = false;
                    });
                });
            });
        });
    },

    handlers: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Module handlers */
        SwitchHandler.handler(rustplus, client, time.response.time);
        TimeHandler.handler(rustplus, client, time.response.time);
        TeamHandler.handler(rustplus, client, teamInfo.response.teamInfo);

        /* Update modules */
        rustplus.time.updateTime(time.response.time);
        rustplus.team.updateTeam(teamInfo.response.teamInfo);
        rustplus.info.updateInfo(info.response.info);

        InformationHandler.handler(rustplus, client, info, mapMarkers, teamInfo, time);

        /* In-game event handlers */
        CargoShip.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        PatrolHelicopter.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        Explosion.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        LockedCrate.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        OilRig.handler(rustplus, client, info, mapMarkers, teamInfo, time);
        VendingMachine.handler(rustplus, client, info, mapMarkers, teamInfo, time);
    },
};