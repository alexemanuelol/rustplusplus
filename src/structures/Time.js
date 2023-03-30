/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const TimeLib = require('../util/timer.js');

class Time {
    constructor(time, rustplus, client) {
        this._dayLengthMinutes = time.dayLengthMinutes;
        this._timeScale = time.timeScale;
        this._sunrise = time.sunrise;
        this._sunset = time.sunset;
        this._time = time.time;

        this._rustplus = rustplus;
        this._client = client;

        this._startTime = time.time;
        this._timeTillDay = new Object();
        this._timeTillNight = new Object();
        this._timeTillActive = false;

        this.loadTimeTillConfig();
    }

    /* Getters and Setters */
    get dayLengthMinutes() { return this._dayLengthMinutes; }
    set dayLengthMinutes(dayLengthMinutes) { this._dayLengthMinutes = dayLengthMinutes; }
    get timeScale() { return this._timeScale; }
    set timeScale(timeScale) { this._timeScale = timeScale; }
    get sunrise() { return this._sunrise; }
    set sunrise(sunrise) { this._sunrise = sunrise; }
    get sunset() { return this._sunset; }
    set sunset(sunset) { this._sunset = sunset; }
    get time() { return this._time; }
    set time(time) { this._time = time; }
    get rustplus() { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get client() { return this._client; }
    set client(client) { this._client = client; }
    get startTime() { return this._startTime; }
    set startTime(startTime) { this._startTime = startTime; }
    get timeTillDay() { return this._timeTillDay; }
    set timeTillDay(timeTillDay) { this._timeTillDay = timeTillDay; }
    get timeTillNight() { return this._timeTillNight; }
    set timeTillNight(timeTillNight) { this._timeTillNight = timeTillNight; }
    get timeTillActive() { return this._timeTillActive; }
    set timeTillActive(timeTillActive) { this._timeTillActive = timeTillActive; }

    /* Change checkers */
    isDayLengthMinutesChanged(time) { return ((this.dayLengthMinutes) !== (time.dayLengthMinutes)); }
    isTimeScaleChanged(time) { return ((this.timeScale) !== (time.timeScale)); }
    isSunriseChanged(time) { return ((this.sunrise) !== (time.sunrise)); }
    isSunsetChanged(time) { return ((this.sunset) !== (time.sunset)); }
    isTimeChanged(time) { return ((this.time) !== (time.time)); }

    /* Other checkers */
    isDay() { return ((this.time >= this.sunrise) && (this.time < this.sunset)); }
    isNight() { return !this.isDay(); }
    isTurnedDay(time) { return (this.isNight() && time.time >= time.sunrise && time.time < time.sunset); }
    isTurnedNight(time) { return (this.isDay() && !(time.time >= time.sunrise && time.time < time.sunset)); }

    loadTimeTillConfig() {
        let instance = this.client.getInstance(this.rustplus.guildId);

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

    updateTime(time) {
        this.dayLengthMinutes = time.dayLengthMinutes;
        this.timeScale = time.timeScale;
        this.sunrise = time.sunrise;
        this.sunset = time.sunset;
        this.time = time.time;
    }

    getTimeTillDayOrNight(ignore = '') {
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

        return TimeLib.secondsToFullScale(object[closest], ignore);
    }

}

module.exports = Time;