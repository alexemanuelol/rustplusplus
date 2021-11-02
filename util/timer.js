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
}