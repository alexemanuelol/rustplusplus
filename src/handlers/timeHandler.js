const _ = require('lodash');

module.exports = {
    handler: function (rustplus, client, info, mapMarkers, teamInfo, time) {
        /* Check current time and update time variables */
        module.exports.updateTimeVariables(rustplus, client, time);
    },

    updateTimeVariables: function (rustplus, client, time) {
        const sunrise = parseFloat(time.response.time.sunrise.toFixed(2));
        const sunset = parseFloat(time.response.time.sunset.toFixed(2));
        time = parseFloat(time.response.time.time.toFixed(2));

        if (rustplus.firstPoll) {
            rustplus.startTime = time;
            rustplus.previousTime = time;
            rustplus.startTimeObject[time] = 0;
            return;
        }

        let distance;
        if (rustplus.previousTime > time) {
            distance = (24 - rustplus.previousTime) + time;
        }
        else {
            distance = time - rustplus.previousTime;
        }

        if (distance > 1) {
            /* Too big of a jump for a normal server, might have been a skip night server */
            rustplus.log('ERROR', `Invalid time: distance: ${distance}, previous: ${rustplus.previousTime}, time: ${time}`, 'error');
            rustplus.passedFirstSunriseOrSunset = false;
            rustplus.startTime = time;
            rustplus.previousTime = time;
            rustplus.startTimeObject = new Object();
            rustplus.timeTillDay = new Object();
            rustplus.timeTillNight = new Object();
            rustplus.startTimeObject[time] = 0;
            return;
        }

        if (!rustplus.passedFirstSunriseOrSunset) {
            let a = (rustplus.startTime >= sunrise && rustplus.startTime < sunset) &&
                (time >= sunset || time < sunrise);
            let b = (rustplus.startTime >= sunset || rustplus.startTime < sunrise) &&
                (time >= sunrise && time < sunset);

            for (let id of Object.keys(rustplus.startTimeObject)) {
                rustplus.startTimeObject[id] += (client.pollingIntervalMs / 1000);
            }

            if (a || b) {
                rustplus.passedFirstSunriseOrSunset = true;
            }
            else {
                rustplus.startTimeObject[time] = 0;
                rustplus.previousTime = time;
                return;
            }
        }

        let start = rustplus.startTime;
        let prev = rustplus.previousTime;
        let a = time > start && prev < start && time > prev;
        let b = time < start && prev < start && time < prev;
        let c = time > start && prev > start && time < prev;

        /* If 24 hours in-game time have passed */
        if (a || b || c) {
            /* Merge startTimeObject with correct object */
            let highestValue = 0;
            for (let id of Object.keys(rustplus.startTimeObject)) {
                if (rustplus.startTimeObject[id] > highestValue) {
                    highestValue = rustplus.startTimeObject[id];
                }
            }

            if (rustplus.startTime >= sunrise && rustplus.startTime < sunset) {
                for (let id of Object.keys(rustplus.timeTillNight)) {
                    rustplus.timeTillNight[id] += highestValue;
                }

                rustplus.timeTillNight = _.merge(rustplus.startTimeObject, rustplus.timeTillNight);
            }
            else {
                for (let id of Object.keys(rustplus.timeTillDay)) {
                    rustplus.timeTillDay[id] += highestValue;
                }

                rustplus.timeTillDay = _.merge(rustplus.startTimeObject, rustplus.timeTillDay);
            }

            let instance = client.readInstanceFile(rustplus.guildId);
            let server = `${rustplus.server}-${rustplus.port}`;

            instance.serverList[server].timeTillDay = rustplus.timeTillDay;
            instance.serverList[server].timeTillNight = rustplus.timeTillNight;
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.log('TIME', '24 Successful Hours in-game time have passed.');
            return;
        }

        if (time >= sunrise && time < sunset) {
            /* It's Day */
            /* Increment all values in the object */
            for (let id of Object.keys(rustplus.timeTillNight)) {
                rustplus.timeTillNight[id] += (client.pollingIntervalMs / 1000);
            }

            rustplus.timeTillNight[time] = 0;
        }
        else {
            /* It's Night */
            /* Increment all values in the object */
            for (let id of Object.keys(rustplus.timeTillDay)) {
                rustplus.timeTillDay[id] += (client.pollingIntervalMs / 1000);
            }

            rustplus.timeTillDay[time] = 0;
        }

        rustplus.previousTime = time;
    }
}