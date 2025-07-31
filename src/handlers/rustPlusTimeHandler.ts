/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as rp from 'rustplus-ts';

import { log } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { RustPlusTime } from '../structures/rustPlusTime';

export async function handler(rpInstance: RustPlusInstance, time: rp.AppTime) {
    const fn = '[rustPlusTimeHandler: handler]';
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    if ((rpInstance.rpTime as RustPlusTime).isDayLengthMinutesChanged(time)) {
        log.info(`${fn} dayLengthMinutes changed, ` +
            `old: ${rpInstance.rpTime?.appTime.dayLengthMinutes}, ` +
            `new: ${time.dayLengthMinutes}`,
            logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isTimeScaleChanged(time)) {
        log.info(`${fn} timeScale changed, ` +
            `old: ${rpInstance.rpTime?.appTime.timeScale}, ` +
            `new: ${time.timeScale}`,
            logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isSunriseChanged(time)) {
        log.info(`${fn} sunrise changed, ` +
            `old: ${rpInstance.rpTime?.appTime.sunrise}, ` +
            `new: ${time.sunrise}`,
            logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isSunsetChanged(time)) {
        log.info(`${fn} sunset changed, ` +
            `old: ${rpInstance.rpTime?.appTime.sunset}, ` +
            `new: ${time.sunset}`,
            logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isTimeChanged(time)) {
        //log.info(`${fn} time changed, ` +
        //    `old: ${rpInstance.rpTime?.appTime.time}, ` +
        //    `new: ${time.time}`,
        //    logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isTurnedDay(time)) {
        log.info(`${fn} Just turned day.`, logParam);
    }

    if ((rpInstance.rpTime as RustPlusTime).isTurnedNight(time)) {
        log.info(`${fn} Just turned night.`, logParam);
    }
}