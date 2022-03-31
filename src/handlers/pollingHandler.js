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

const Time = require('../structures/Time');
const Team = require('../structures/Team');
const Info = require('../structures/Info');

module.exports = {
    pollingHandler: async function (rustplus, client) {
        /* Poll information such as info, mapMarkers, teamInfo and time */
        let info = await rustplus.getInfoAsync();
        if (!(await rustplus.isResponseValid(info))) return;
        let mapMarkers = await rustplus.getMapMarkersAsync();
        if (!(await rustplus.isResponseValid(mapMarkers))) return;
        let teamInfo = await rustplus.getTeamInfoAsync();
        if (!(await rustplus.isResponseValid(teamInfo))) return;
        let time = await rustplus.getTimeAsync();
        if (!(await rustplus.isResponseValid(time))) return;

        if (rustplus.firstPoll) {
            rustplus.info = new Info(info.info);
            rustplus.time = new Time(time.time, rustplus, client);
            rustplus.team = new Team(teamInfo.teamInfo, rustplus);
        }

        module.exports.handlers(rustplus, client, info, mapMarkers, teamInfo, time);
        rustplus.firstPoll = false;
    },

    handlers: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Module handlers */
        SwitchHandler.handler(rustplus, client, time.time);
        TimeHandler.handler(rustplus, client, time.time);
        TeamHandler.handler(rustplus, client, teamInfo.teamInfo);

        /* Update modules */
        rustplus.time.updateTime(time.time);
        rustplus.team.updateTeam(teamInfo.teamInfo);
        rustplus.info.updateInfo(info.info);

        InformationHandler.handler(rustplus, client);

        /* In-game event handlers */
        CargoShip.handler(rustplus, mapMarkers.mapMarkers);
        PatrolHelicopter.handler(rustplus, mapMarkers.mapMarkers);
        Explosion.handler(rustplus, mapMarkers.mapMarkers);
        LockedCrate.handler(rustplus, mapMarkers.mapMarkers);
        OilRig.handler(rustplus, mapMarkers.mapMarkers);
        VendingMachine.handler(rustplus, mapMarkers.mapMarkers);
    },
};