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

module.exports = {
    timer: function (callback, delay, ...args) {
        let id, started, remaining = delay, running = false;

        this.start = function () {
            started = new Date();
            if (remaining > 0) {
                id = setTimeout(callback, remaining, args);
                running = true;
                return true;
            }
            else {
                running = false;
                return false;
            }
        }

        this.stop = function () {
            running = false;
            remaining = delay;
            clearTimeout(id);
        }

        this.pause = function () {
            running = false;
            clearTimeout(id);
            remaining -= new Date() - started;
        }

        this.restart = function () {
            this.stop();
            remaining = delay;
            this.start();
        }

        this.getTimeLeft = function () {
            if (this.getStateRunning()) {
                this.pause();
                this.start();
            }

            if (remaining <= 0) return 0;
            return remaining;
        }

        this.isFinished = function () {
            /* If exceeded initial delay value */
            if ((new Date() - started) > delay) {
                running = false;
                return true;
            }
            return false;
        }

        this.getStateRunning = function () {
            this.isFinished();
            return running;
        }
    },

    getTimeLeftOfTimer: function (timer, ignore = '') {
        /* Returns the time left of a timer. If timer is not running, null will be returned. */
        if (timer.getStateRunning()) return this.secondsToFullScale(timer.getTimeLeft() / 1000, ignore);
        return null;
    },

    secondsToFullScale: function (totSeconds, ignore = '', longAbbr = false) {
        totSeconds = Math.floor(totSeconds);

        const day = 86400;
        const hour = 3600;
        const minute = 60;
        const second = 1;

        const originalDays = Math.floor(totSeconds / day);
        const originalHours = Math.floor((totSeconds - originalDays * day) / hour);
        const originalMinutes = Math.floor((totSeconds - originalDays * day - originalHours * hour) / minute);
        const originalSeconds = totSeconds - originalDays * day - originalHours * hour - originalMinutes * minute;

        let days = 0;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        let time = '';

        days += originalDays;
        if (days > 0 && !ignore.includes('d')) {
            time += longAbbr ? `${days} days ` : `${days}d `;
        }
        else if (days > 0 && ignore.includes('d')) {
            hours += (day / hour) * days;
        }

        hours += originalHours;
        if (hours > 0 && !ignore.includes('h')) {
            time += longAbbr ? `${hours} hours ` : `${hours}h `;
        }
        else if (hours > 0 && ignore.includes('h')) {
            minutes += (hour / minute) * hours;
        }

        minutes += originalMinutes;
        if (minutes > 0 && !ignore.includes('m')) {
            time += longAbbr ? `${minutes} min ` : `${minutes}m `;
        }
        else if (minutes > 0 && ignore.includes('m')) {
            seconds += (minute / second) * minutes;
        }

        seconds += originalSeconds;
        if (seconds > 0 && !ignore.includes('s')) {
            time += longAbbr ? `${seconds} sec ` : `${seconds}s`;
        }

        time = time.trim();

        if (time === '') {
            if (!ignore.includes('s')) {
                time = longAbbr ? '0 sec' : '0s';
            }
            else if (!ignore.includes('m')) {
                time = longAbbr ? '0 min' : '0m';
            }
            else if (!ignore.includes('h')) {
                time = longAbbr ? '0 hours' : '0h';
            }
            else if (!ignore.includes('d')) {
                time = longAbbr ? '0 days' : '0d';
            }
            else {
                time = longAbbr ? '0 sec' : '0s';
            }
        }
        return time;
    },

    convertDecimalToHoursMinutes: function (time) {
        let hours = Math.floor(time);
        let minutes = Math.floor((time - hours) * 60);

        hours = (hours < 10) ? `0${hours}`.toString() : hours.toString();
        minutes = (minutes < 10) ? `0${minutes}`.toString() : minutes.toString();

        return `${hours}:${minutes}`;
    },

    getSecondsFromStringTime: function (str) {
        const matches = str.match(/\d+[dhms]/g);
        let totSeconds = 0;

        if (matches === null) {
            return null;
        }

        for (const match of matches) {
            let value = parseInt(match.slice(0, -1));
            switch (match[match.length - 1]) {
                case 'd': { /* Days */
                    totSeconds += value * 24 * 60 * 60;
                } break;

                case 'h': { /* Hours */
                    totSeconds += value * 60 * 60;
                } break;

                case 'm': { /* Minutes */
                    totSeconds += value * 60;
                } break;

                case 's': { /* Seconds */
                    totSeconds += value;
                } break;

                default: {
                } break;
            }
        }

        return totSeconds;
    },

    sleep: function (ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },

    getCurrentDateTime: function () {
        const newDate = new Date();

        const date = ('0' + newDate.getDate()).slice(-2);
        const month = ('0' + (newDate.getMonth() + 1)).slice(-2);
        const year = newDate.getFullYear();
        const hours = newDate.getHours();
        const minutes = newDate.getMinutes();
        const seconds = newDate.getSeconds();

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    },
}