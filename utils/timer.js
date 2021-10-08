module.exports = {
    timer: function (callback, delay) {
        var id, started, remaining = delay, running;

        this.start = function () {
            running = true;
            started = new Date();
            id = setTimeout(callback, remaining);
        }

        this.stop = function () {
            running = false;
            clearTimeout(id);
            remaining = 0;
        }

        this.pause = function () {
            running = false;
            clearTimeout(id);
            remaining -= new Date() - started;
        }

        this.getTimeLeft = function () {
            if (running) {
                this.pause();
                this.start();
            }

            return remaining;
        }

        this.getStateRunning = function () {
            return running;
        }

        this.start();
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
        time += (days === 0) ? "" : days + 'd ';
        time += (hours === 0 && totalSeconds < hour) ? "" : hours + 'h ';
        time += (minutes === 0 && totalSeconds < minute) ? "" : minutes + 'm ';
        time += seconds + 's';

        return time;
    },
}