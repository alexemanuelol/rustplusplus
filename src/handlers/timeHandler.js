const _ = require('lodash');

module.exports = {
    handler: function (rustplus, client, time) {
        /* Check time changes */
        module.exports.checkChanges(rustplus, client, time);
    },

    checkChanges: function (rustplus, client, time) {
        if (rustplus.time.timeTillActive) {
            return;
        }

        let prevTime = rustplus.time.time;
        let newTime = time.time;

        if (rustplus.firstPoll) {
            rustplus.time.startTime = newTime;
            rustplus.startTimeObject[newTime] = 0;
            return;
        }

        let distance = (prevTime > newTime) ? (24 - prevTime) + newTime : newTime - prevTime;
        if (distance > 1) {
            /* Too big of a jump for a normal server, might have been a skip night server */
            rustplus.log(
                'ERROR',
                `Invalid time: distance: ${distance}, previous: ${prevTime}, time: ${newTime}`,
                'error');
            rustplus.passedFirstSunriseOrSunset = false;
            rustplus.time.startTime = newTime;
            rustplus.time.timeTillDay = new Object();
            rustplus.time.timeTillNight = new Object();
            rustplus.startTimeObject = new Object();
            rustplus.startTimeObject[newTime] = 0;
            return;
        }

        if (!rustplus.passedFirstSunriseOrSunset) {
            let a = (rustplus.time.startTime >= time.sunrise &&
                rustplus.time.startTime < time.sunset) &&
                (newTime >= time.sunset || newTime < time.sunrise);
            let b = (rustplus.time.startTime >= time.sunset ||
                rustplus.time.startTime < time.sunrise) &&
                (newTime >= time.sunrise && newTime < time.sunset);

            for (let id of Object.keys(rustplus.startTimeObject)) {
                rustplus.startTimeObject[id] += (client.pollingIntervalMs / 1000);
            }

            if (a || b) {
                rustplus.passedFirstSunriseOrSunset = true;
            }
            else {
                rustplus.startTimeObject[newTime] = 0;
                return;
            }
        }

        let a = newTime > rustplus.time.startTime && prevTime < rustplus.time.startTime && newTime > prevTime;
        let b = newTime < rustplus.time.startTime && prevTime < rustplus.time.startTime && newTime < prevTime;
        let c = newTime > rustplus.time.startTime && prevTime > rustplus.time.startTime && newTime < prevTime;

        /* If 24 hours in-game time have passed */
        if (a || b || c) {
            /* Merge startTimeObject with correct object */
            let highestValue = 0;
            for (let id of Object.keys(rustplus.startTimeObject)) {
                if (rustplus.startTimeObject[id] > highestValue) {
                    highestValue = rustplus.startTimeObject[id];
                }
            }

            if (rustplus.time.startTime >= time.sunrise && rustplus.time.startTime < time.sunset) {
                for (let id of Object.keys(rustplus.time.timeTillNight)) {
                    rustplus.time.timeTillNight[id] += highestValue;
                }

                rustplus.time.timeTillNight = _.merge(rustplus.startTimeObject, rustplus.time.timeTillNight);
            }
            else {
                for (let id of Object.keys(rustplus.time.timeTillDay)) {
                    rustplus.time.timeTillDay[id] += highestValue;
                }

                rustplus.time.timeTillDay = _.merge(rustplus.startTimeObject, rustplus.time.timeTillDay);
            }

            rustplus.time.timeTillActive = true;

            let instance = client.readInstanceFile(rustplus.guildId);

            instance.serverList[rustplus.serverId].timeTillDay = rustplus.time.timeTillDay;
            instance.serverList[rustplus.serverId].timeTillNight = rustplus.time.timeTillNight;
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.log('TIME', '24 Successful Hours in-game time have passed.');
            return;
        }

        if (newTime >= time.sunrise && newTime < time.sunset) { /* It's Day */
            for (let id of Object.keys(rustplus.time.timeTillNight)) {
                rustplus.time.timeTillNight[id] += (client.pollingIntervalMs / 1000);
            }

            rustplus.time.timeTillNight[newTime] = 0;
        }
        else { /* It's Night */
            for (let id of Object.keys(rustplus.time.timeTillDay)) {
                rustplus.time.timeTillDay[id] += (client.pollingIntervalMs / 1000);
            }

            rustplus.time.timeTillDay[newTime] = 0;
        }
    }
}