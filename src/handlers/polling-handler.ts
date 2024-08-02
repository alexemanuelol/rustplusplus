/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import { client } from '../../index';
import { informationHandler } from './information-handler';
import { timeHandler } from './time-handler';
import { teamHandler } from './team-handler';
import { vendingMachineHandler } from './vending-machine-handler';
import { storageMonitorHandler } from './storage-monitor-handler';
import { smartAlarmHandler } from './smart-alarm-handler';
import { smartSwitchHandler } from './smart-switch-handler';
const { RustPlus } = require('../structures/RustPlus');
const Info = require('../structures/Info');
const MapMarkers = require('../structures/MapMarkers.js');
const Team = require('../structures/Team');
const Time = require('../structures/Time');

export async function pollingHandler(rustplus: typeof RustPlus) {
    /* Poll information such as info, mapMarkers, teamInfo and time */
    const info = await rustplus.getInfoAsync();
    if (!(await rustplus.isResponseValid(info))) return;
    const mapMarkers = await rustplus.getMapMarkersAsync();
    if (!(await rustplus.isResponseValid(mapMarkers))) return;
    const teamInfo = await rustplus.getTeamInfoAsync();
    if (!(await rustplus.isResponseValid(teamInfo))) return;
    const time = await rustplus.getTimeAsync();
    if (!(await rustplus.isResponseValid(time))) return;

    if (rustplus.isFirstPoll) {
        rustplus.sInfo = new Info(info.info);
        rustplus.time = new Time(time.time, rustplus, client);
        rustplus.team = new Team(teamInfo.teamInfo, rustplus);
        rustplus.mapMarkers = new MapMarkers(mapMarkers.mapMarkers, rustplus, client);
    }

    await teamHandler(rustplus, teamInfo.teamInfo)
    rustplus.team.updateTeam(teamInfo.teamInfo);

    await smartSwitchHandler(rustplus, time.time);
    timeHandler(rustplus, time.time)
    await vendingMachineHandler(rustplus, mapMarkers.mapMarkers)

    rustplus.time.updateTime(time.time);
    rustplus.sInfo.updateInfo(info.info);
    rustplus.mapMarkers.updateMapMarkers(mapMarkers.mapMarkers);

    await informationHandler(rustplus);
    await storageMonitorHandler(rustplus);
    await smartAlarmHandler(rustplus);

    rustplus.isFirstPoll = false;
}