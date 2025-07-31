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

import * as fs from 'fs';
import * as path from 'path';
import * as rp from 'rustplus-ts';

import { log, guildInstanceManager as gim } from '../../index';
import { secondsToFullScale } from "../utils/timer";
import { GuildInstance } from '../managers/guildInstanceManager';
import { RustPlusInstance } from '../managers/rustPlusManager';

interface TimeTable {
    [time: string]: number
}

export interface TimeTillSunriseOrSunset {
    timeTill: string;
    isDay: boolean
}

/* rustPlusTimeTableDefault.json data is based on the following values: */
const dayLengthMinutes = 60; /* eslint-disable-line @typescript-eslint/no-unused-vars */
const sunrise = 7.53697538;
const sunset = 19.83786201;
const timescale = 1; /* eslint-disable-line @typescript-eslint/no-unused-vars */
const timeTable = getTimeTable();

export class RustPlusTime {
    public rpInstance: RustPlusInstance;
    public appTime: rp.AppTime;

    public dayDuration: number | null;
    public nightDuration: number | null;
    public latestSunrise: Date | null;
    public latestSunset: Date | null;

    constructor(rpInstance: RustPlusInstance, appTime: rp.AppTime) {
        this.rpInstance = rpInstance;
        this.appTime = appTime;

        this.dayDuration = null;
        this.nightDuration = null;
        this.latestSunrise = null;
        this.latestSunset = null;
    }

    public updateTime(appTime: rp.AppTime) {
        this.updateVariables(appTime);
        this.appTime = appTime;
    }

    public isDay(): boolean {
        return (this.appTime.time >= this.appTime.sunrise) && (this.appTime.time < this.appTime.sunset);
    }

    public isNight(): boolean {
        return !this.isDay();
    }

    public getTimeTillSunriseOrSunset(ignore: string = ''): TimeTillSunriseOrSunset {
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.rpInstance.serverId];

        let seconds = 0;
        let isDay = this.isDay();

        /* Can't calculate time till sunrise or sunset, so use the default time table */
        if ((this.isDay() && (this.latestSunrise === null || server.dayDurationSeconds === null)) ||
            this.isNight() && (this.latestSunset === null || server.nightDurationSeconds === null)) {
            const closestTimeKey = getClosestTimeKey(this.appTime.time);
            seconds = timeTable[closestTimeKey];
            isDay = (this.appTime.time >= sunrise) && (this.appTime.time < sunset)
        }
        else if (this.isDay()) {
            const currentTimeSeconds = (new Date()).getTime() / 1000;
            const latestSunriseSeconds = (this.latestSunrise as Date).getTime() / 1000;
            seconds = (server.dayDurationSeconds as number) - (currentTimeSeconds - latestSunriseSeconds);
        }
        else {
            const currentTimeSeconds = (new Date()).getTime() / 1000;
            const latestSunsetSeconds = (this.latestSunset as Date).getTime() / 1000;
            seconds = (server.nightDurationSeconds as number) - (currentTimeSeconds - latestSunsetSeconds);
        }

        return { timeTill: secondsToFullScale(seconds, ignore), isDay: isDay };
    }

    public isDayLengthMinutesChanged(appTime: rp.AppTime): boolean {
        return this.appTime.dayLengthMinutes !== appTime.dayLengthMinutes;
    }

    public isTimeScaleChanged(appTime: rp.AppTime): boolean {
        return this.appTime.timeScale !== appTime.timeScale;
    }

    public isSunriseChanged(appTime: rp.AppTime): boolean {
        return this.appTime.sunrise !== appTime.sunrise;
    }

    public isSunsetChanged(appTime: rp.AppTime): boolean {
        return this.appTime.sunset !== appTime.sunset;
    }

    public isTimeChanged(appTime: rp.AppTime): boolean {
        return this.appTime.time !== appTime.time;
    }

    public isTurnedDay(appTime: rp.AppTime): boolean {
        return this.isNight() && appTime.time >= appTime.sunrise && appTime.time < appTime.sunset;
    }

    public isTurnedNight(appTime: rp.AppTime): boolean {
        return this.isDay() && !(appTime.time >= appTime.sunrise && appTime.time < appTime.sunset);
    }

    private updateVariables(appTime: rp.AppTime) {
        const fn = '[RustPlusTime: updateVariables]';
        const logParam = {
            guildId: this.rpInstance.guildId,
            serverId: this.rpInstance.serverId,
            serverName: this.rpInstance.serverName
        };

        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.rpInstance.serverId];

        const prevTime = this.appTime.time;
        const newTime = appTime.time;

        const distance = (prevTime > newTime) ? (24 - prevTime) + newTime : newTime - prevTime;
        if (distance > 1) {
            /* Too big of a jump for a normal server, might have been a skip night server. */
            log.warn(`${fn} Invalid time distance: ${distance}, prev: ${prevTime}, new: ${newTime}`, logParam);
            this.latestSunrise = null;
            this.latestSunset = null;
            return;
        }

        if (this.isTurnedDay(appTime)) {
            this.latestSunrise = new Date();

            if (this.latestSunset !== null) {
                server.nightDurationSeconds =
                    Math.floor((this.latestSunrise.getTime() - this.latestSunset.getTime()) / 1000);
                gim.updateGuildInstance(this.rpInstance.guildId);
            }
        }
        else if (this.isTurnedNight(appTime)) {
            this.latestSunset = new Date();

            if (this.latestSunrise !== null) {
                server.dayDurationSeconds =
                    Math.floor((this.latestSunset.getTime() - this.latestSunrise.getTime()) / 1000);
                gim.updateGuildInstance(this.rpInstance.guildId);
            }
        }
    }
}


function getTimeTable(): TimeTable {
    const filePath = path.join(__dirname, "../staticFiles/rustPlusTimeTableDefault.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);

    return parsed as TimeTable;
}

function getClosestTimeKey(time: number): string {
    let closestTimeKey: string = '';
    let smallestDiff = Infinity;

    function isDay(time: number): boolean {
        return (time >= sunrise) && (time < sunset);
    }

    for (const key of Object.keys(timeTable)) {
        const keyTime = parseFloat(key);

        if (isDay(time) && !isDay(keyTime) || !isDay(time) && isDay(keyTime)) continue;

        const diff = Math.abs(time - keyTime);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestTimeKey = key;
        }
    }

    return closestTimeKey as string;
}