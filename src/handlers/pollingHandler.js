const Info = require('../structures/Info');
const InformationHandler = require('../handlers/informationHandler.js');
const MapMarkers = require('../structures/MapMarkers.js');
const SmartAlarmHandler = require('../handlers/smartAlarmHandler.js');
const SmartSwitchHandler = require('../handlers/smartSwitchHandler.js');
const StorageMonitorHandler = require('../handlers/storageMonitorHandler.js');
const Team = require('../structures/Team');
const TeamHandler = require('../handlers/teamHandler.js');
const Time = require('../structures/Time');
const TimeHandler = require('../handlers/timeHandler.js');

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

        if (rustplus.isFirstPoll) {
            rustplus.info = new Info(info.info);
            rustplus.time = new Time(time.time, rustplus, client);
            rustplus.team = new Team(teamInfo.teamInfo, rustplus);
            rustplus.mapMarkers = new MapMarkers(mapMarkers.mapMarkers, rustplus, client);
        }

        module.exports.handlers(rustplus, client, info, mapMarkers, teamInfo, time);
        rustplus.isFirstPoll = false;
    },

    handlers: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Module handlers */
        SmartSwitchHandler.handler(rustplus, client, time.time);
        TimeHandler.handler(rustplus, client, time.time);
        TeamHandler.handler(rustplus, client, teamInfo.teamInfo);

        /* Update modules */
        rustplus.time.updateTime(time.time);
        rustplus.team.updateTeam(teamInfo.teamInfo);
        rustplus.info.updateInfo(info.info);
        rustplus.mapMarkers.updateMapMarkers(mapMarkers.mapMarkers);

        InformationHandler.handler(rustplus);
        StorageMonitorHandler.handler(rustplus, client);
        SmartAlarmHandler.handler(rustplus, client);
    },
};