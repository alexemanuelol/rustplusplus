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

    secondsToFullScale: function (totSeconds, ignore = '') {
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
            time += `${days}d `;
        }
        else if (days > 0 && ignore.includes('d')) {
            hours += (day / hour) * days;
        }

        hours += originalHours;
        if (hours > 0 && !ignore.includes('h')) {
            time += `${hours}h `;
        }
        else if (hours > 0 && ignore.includes('h')) {
            minutes += (hour / minute) * hours;
        }

        minutes += originalMinutes;
        if (minutes > 0 && !ignore.includes('m')) {
            time += `${minutes}m `;
        }
        else if (minutes > 0 && ignore.includes('m')) {
            seconds += (minute / second) * minutes;
        }

        seconds += originalSeconds;
        if (seconds > 0 && !ignore.includes('s')) {
            time += `${seconds}s`;
        }

        time = time.trim();

        if (time === '') {
            if (!ignore.includes('s')) {
                time = '0s';
            }
            else if (!ignore.includes('m')) {
                time = '0m';
            }
            else if (!ignore.includes('h')) {
                time = '0h';
            }
            else if (!ignore.includes('d')) {
                time = '0d';
            }
            else {
                time = '0s';
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
}