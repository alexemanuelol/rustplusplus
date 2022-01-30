module.exports = {
    timer: function (callback, delay, ...args) {
        var id, started, remaining = delay, running = false;

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

            if (remaining <= 0) {
                return 0;
            }
            else {
                return remaining;
            }
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

    secondsToFullScale: function (totalSeconds) {
        totalSeconds = Math.floor(totalSeconds);

        const day = 86400;
        const hour = 3600;
        const minute = 60;

        let days = Math.floor(totalSeconds / day);
        let hours = Math.floor((totalSeconds - days * day) / hour);
        let minutes = Math.floor((totalSeconds - days * day - hours * hour) / minute);
        let seconds = totalSeconds - days * day - hours * hour - minutes * minute;

        let time = '';
        time += (days === 0) ? "" : `${days}d `;
        time += (hours === 0 && totalSeconds < hour) ? "" : `${hours}h `;
        time += (minutes === 0 && totalSeconds < minute) ? "" : `${minutes}m `;
        time += `${seconds}s`;

        return time;
    },

    convertToHoursMinutes: function (value) {
        let hours = Math.floor(value);
        let minutes = Math.floor((value - hours) * 60);

        hours = (hours < 10) ? `0${hours}`.toString() : hours.toString();
        minutes = (minutes < 10) ? `0${minutes}`.toString() : minutes.toString();

        return `${hours}:${minutes}`;
    },

    getSecondsFromStringTime: function (stringTime) {
        let matches = stringTime.match(/\d+\w/g);
        let totalSeconds = 0;

        for (let time of matches) {
            let value = parseInt(time.slice(0, -1));
            switch (time[time.length - 1]) {
                case 'd': /* Days */
                    totalSeconds += value * 24 * 60 * 60;
                    break;

                case 'h': /* Hours */
                    totalSeconds += value * 60 * 60;
                    break;

                case 'm': /* Minutes */
                    totalSeconds += value * 60;
                    break;

                case 's': /* Seconds */
                    totalSeconds += value;
                    break;

                default:
                    break;
            }
        }

        return totalSeconds;
    },
}