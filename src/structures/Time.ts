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

import * as guildInstance from '../util/guild-instance';
import { secondsToFullScale } from "../util/timer";
const { RustPlus } = require('./RustPlus');

export interface TimeConfig {
    dayLengthMinutes: number;
    timeScale: number;
    sunrise: number;
    sunset: number;
    time: number;
}

export interface TimeTillConfig {
    [key: number]: number;
}

export class Time {
    private _dayLengthMinutes: number;
    private _timeScale: number;
    private _sunrise: number;
    private _sunset: number;
    private _time: number;

    private _rustplus: typeof RustPlus;

    private _startTime: number;
    private _timeTillDay: TimeTillConfig;
    private _timeTillNight: TimeTillConfig;
    private _timeTillActive: boolean;

    constructor(rustplus: typeof RustPlus, time: TimeConfig) {
        this._dayLengthMinutes = time.dayLengthMinutes;
        this._timeScale = time.timeScale;
        this._sunrise = time.sunrise;
        this._sunset = time.sunset;
        this._time = time.time;

        this._rustplus = rustplus;

        this._startTime = time.time;
        this._timeTillDay = {};
        this._timeTillNight = {};
        this._timeTillActive = false;

        this.loadTimeTillConfig();
    }

    /* Getters and Setters */
    get dayLengthMinutes(): number { return this._dayLengthMinutes; }
    set dayLengthMinutes(dayLengthMinutes) { this._dayLengthMinutes = dayLengthMinutes; }
    get timeScale(): number { return this._timeScale; }
    set timeScale(timeScale) { this._timeScale = timeScale; }
    get sunrise(): number { return this._sunrise; }
    set sunrise(sunrise) { this._sunrise = sunrise; }
    get sunset(): number { return this._sunset; }
    set sunset(sunset) { this._sunset = sunset; }
    get time(): number { return this._time; }
    set time(time) { this._time = time; }
    get rustplus(): typeof RustPlus { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get startTime(): number { return this._startTime; }
    set startTime(startTime) { this._startTime = startTime; }
    get timeTillDay(): TimeTillConfig { return this._timeTillDay; }
    set timeTillDay(timeTillDay) { this._timeTillDay = timeTillDay; }
    get timeTillNight(): TimeTillConfig { return this._timeTillNight; }
    set timeTillNight(timeTillNight) { this._timeTillNight = timeTillNight; }
    get timeTillActive(): boolean { return this._timeTillActive; }
    set timeTillActive(timeTillActive) { this._timeTillActive = timeTillActive; }

    /* Change checkers */
    isDayLengthMinutesChanged(time: TimeConfig): boolean {
        return ((this.dayLengthMinutes) !== (time.dayLengthMinutes));
    }

    isTimeScaleChanged(time: TimeConfig): boolean {
        return ((this.timeScale) !== (time.timeScale));
    }

    isSunriseChanged(time: TimeConfig): boolean {
        return ((this.sunrise) !== (time.sunrise));
    }

    isSunsetChanged(time: TimeConfig): boolean {
        return ((this.sunset) !== (time.sunset));
    }

    isTimeChanged(time: TimeConfig): boolean {
        return ((this.time) !== (time.time));
    }

    /* Other checkers */
    isDay(): boolean {
        return ((this.time >= this.sunrise) && (this.time < this.sunset));
    }

    isNight(): boolean {
        return !this.isDay();
    }

    isTurnedDay(time: TimeConfig): boolean {
        return (this.isNight() && time.time >= time.sunrise && time.time < time.sunset);
    }

    isTurnedNight(time: TimeConfig): boolean {
        return (this.isDay() && !(time.time >= time.sunrise && time.time < time.sunset));
    }

    loadTimeTillConfig() {
        const instance = guildInstance.readGuildInstanceFile(this.rustplus.guildId);

        if (instance.serverList[this.rustplus.serverId].timeTillDay !== null) {
            this.timeTillDay = instance.serverList[this.rustplus.serverId].timeTillDay;
        }
        if (instance.serverList[this.rustplus.serverId].timeTillNight !== null) {
            this.timeTillNight = instance.serverList[this.rustplus.serverId].timeTillNight;
        }

        this.timeTillActive =
            Object.keys(this.timeTillDay).length !== 0 &&
            Object.keys(this.timeTillNight).length !== 0;
    }

    updateTime(time: TimeConfig) {
        this.dayLengthMinutes = time.dayLengthMinutes;
        this.timeScale = time.timeScale;
        this.sunrise = time.sunrise;
        this.sunset = time.sunset;
        this.time = time.time;
    }

    getTimeTillDayOrNight(ignore: string = ''): string | null {
        if (!this.timeTillActive) {
            return null;
        }

        let object = null;
        if (this.isDay()) {
            object = this.timeTillNight;
        }
        else {
            object = this.timeTillDay;
        }

        let time = this.time;
        let closest = Object.keys(object).map(Number).reduce(function (a, b) {
            return (Math.abs(b - time) < Math.abs(a - time) ? b : a);
        });

        return secondsToFullScale(object[closest], ignore);
    }

}