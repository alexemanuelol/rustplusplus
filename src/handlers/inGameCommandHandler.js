const Timer = require('../util/timer');
const StringSimilarity = require('../util/stringSimilarity.js');

module.exports = {
    inGameCommandHandler: function (rustplus, client, message) {
        let command = message.broadcast.teamMessage.message.message;

        if (command === `${rustplus.generalSettings.prefix}bradley`) {
            module.exports.commandBradley(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}cargo`) {
            module.exports.commandCargo(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}heli`) {
            module.exports.commandHeli(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}large`) {
            module.exports.commandLarge(rustplus);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}leader`)) {
            module.exports.commandLeader(rustplus, message);
        }
        else if (command === `${rustplus.generalSettings.prefix}offline`) {
            module.exports.commandOffline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}online`) {
            module.exports.commandOnline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}pop`) {
            module.exports.commandPop(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}small`) {
            module.exports.commandSmall(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}time`) {
            module.exports.commandTime(rustplus, client);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            module.exports.commandTimer(rustplus, command);
        }
        else if (command === `${rustplus.generalSettings.prefix}wipe`) {
            module.exports.commandWipe(rustplus);
        }
    },

    commandBradley: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            timerCounter += 1;
            let time = rustplus.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(`Approximately ${time} before Bradley APC respawns.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceBradleyWasDestroyed === null) {
                strings.push('Bradley APC is probably roaming around at Launch Site.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceBradleyWasDestroyed) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Bradley APC got destroyed.`)
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandCargo: function (rustplus) {
        let strings = [];
        let unhandled = Object.keys(rustplus.activeCargoShips);
        let numOfShips = unhandled.length;

        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            unhandled = unhandled.filter(e => e != parseInt(id));
            let time = rustplus.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeCargoShips[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Cargo Ship at ${pos} enters egress stage.`);
            }
        }

        if (unhandled !== []) {
            for (let cargoShip of unhandled) {
                let pos = rustplus.activeCargoShips[cargoShip].location;
                strings.push(`Cargo Ship is located at ${pos}.`);
            }
        }

        if (numOfShips === 0) {
            if (rustplus.timeSinceCargoWasOut === null) {
                strings.push('Cargo Ship is currently not on the map.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceCargoWasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Cargo Ship left.`)
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandHeli: function (rustplus) {
        let strings = [];

        let heliCounter = 0;
        for (const [id, content] of Object.entries(rustplus.activePatrolHelicopters)) {
            heliCounter += 1;
            strings.push(`Patrol Helicopter is located at ${content.location}.`);
        }

        if (heliCounter === 0) {
            if (rustplus.timeSinceHeliWasOnMap === null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                strings.push('No current data on Patrol Helicopter.');
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since the last Patrol Helicopter was on the map.`);
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed !== null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSinceOut = Timer.secondsToFullScale(secondsSince);
                secondsSince = (new Date() - rustplus.timeSinceHeliWasDestroyed) / 1000;
                let timeSinceDestroyed = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSinceOut} since Patrol Helicopter was on the map and ` +
                    `${timeSinceDestroyed} since it got downed.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandLarge: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.lockedCrateLargeOilRigTimers)) {
            timerCounter += 1;
            let time = rustplus.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Locked Crate unlocks at Large Oil Rig at ${pos}.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceLargeOilRigWasTriggered === null) {
                strings.push('No current data on Large Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceLargeOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Large Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandLeader: function (rustplus, message) {
        let command = message.broadcast.teamMessage.message.message;
        let callerId = message.broadcast.teamMessage.message.steamId;
        let callerName = message.broadcast.teamMessage.message.name;

        rustplus.getTeamInfo((msg) => {
            if (msg.response.hasOwnProperty('teamInfo')) {
                if (command === `${rustplus.generalSettings.prefix}leader`) {
                    promoteToLeader(rustplus, callerId).then((result) => {
                        rustplus.log('COMMAND', `Team Leadership was transferred to ${callerName}:${callerId}.`);
                    }).catch((error) => {
                        rustplus.log('ERROR', JSON.stringify(error), 'error');
                    });
                }
                else {
                    let name = command.replace(`${rustplus.generalSettings.prefix}leader `, '');

                    /* Look if the value provided is a steamId */
                    for (let member of msg.response.teamInfo.members) {
                        if (name == member.steamId) {
                            promoteToLeader(rustplus, member.steamId).then((result) => {
                                rustplus.log('COMMAND', `Team Leadership was transferred to ${member.name}:${name}.`);
                            }).catch((error) => {
                                rustplus.log('ERROR', JSON.stringify(error), 'error');
                            });
                            return;
                        }
                    }

                    /* Find the closest name */
                    for (let member of msg.response.teamInfo.members) {
                        if (StringSimilarity.similarity(name, member.name) >= 0.9) {
                            promoteToLeader(rustplus, member.steamId).then((result) => {
                                rustplus.log('COMMAND', `Team Leadership was transferred to ${name}:` +
                                    `${member.steamId}.`);
                            }).catch((error) => {
                                rustplus.log('ERROR', JSON.stringify(error), 'error');
                            });
                            return;
                        }
                    }
                }
            }
        });
    },

    commandOffline: function (rustplus) {
        rustplus.getTeamInfo((teamInfo) => {
            if (teamInfo.response.hasOwnProperty('teamInfo')) {
                let str = '';
                for (let member of teamInfo.response.teamInfo.members) {
                    if (member.isOnline === false) {
                        str += `${member.name}, `;
                    }
                }

                if (str === '') {
                    str = 'No one is offline.';
                }
                else {
                    str = str.slice(0, -2);
                }

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },

    commandOnline: function (rustplus) {
        rustplus.getTeamInfo((teamInfo) => {
            if (teamInfo.response.hasOwnProperty('teamInfo')) {
                let str = '';
                for (let member of teamInfo.response.teamInfo.members) {
                    if (member.isOnline === true) {
                        str += `${member.name}, `;
                    }
                }

                str = str.slice(0, -2);

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },

    commandPop: function (rustplus) {
        rustplus.getInfo((msg) => {
            if (msg.response.hasOwnProperty('info')) {
                const now = msg.response.info.players;
                const max = msg.response.info.maxPlayers;
                const queue = msg.response.info.queuedPlayers;

                let str = `Population: (${now}/${max}) players`;

                if (queue !== 0) {
                    str += ` and ${queue} players in queue.`;
                }

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },

    commandSmall: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.lockedCrateSmallOilRigTimers)) {
            timerCounter += 1;
            let time = rustplus.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Locked Crate unlocks at Small Oil Rig at ${pos}.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceSmallOilRigWasTriggered === null) {
                strings.push('No current data on Small Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceSmallOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Small Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandTime: function (rustplus, client) {
        rustplus.getTime((msg) => {
            if (msg.response.hasOwnProperty('time')) {
                const rawTime = parseFloat(msg.response.time.time.toFixed(2));
                const sunrise = parseFloat(msg.response.time.sunrise.toFixed(2));
                const sunset = parseFloat(msg.response.time.sunset.toFixed(2));
                const time = Timer.convertToHoursMinutes(msg.response.time.time);
                let str = `In-Game time: ${time}.`;

                let timeLeft = Timer.getTimeBeforeSunriseOrSunset(rustplus, client, msg);
                if (timeLeft !== null) {
                    if (rawTime >= sunrise && rawTime < sunset) {
                        /* It's Day */
                        str += ` Approximately ${timeLeft} before nightfall.`;
                    }
                    else {
                        /* It's Night */
                        str += ` Approximately ${timeLeft} before daybreak.`;
                    }
                }

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },

    commandTimer: function (rustplus, command) {
        if (!command.startsWith('!timer ')) {
            return;
        }

        command = command.replace('!timer ', '');
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        if (subcommand !== 'remain' && command === '') {
            return;
        }

        let id;
        switch (subcommand) {
            case 'add':
                let time = command.replace(/ .*/, '');
                let timeSeconds = Timer.getSecondsFromStringTime(time);
                if (timeSeconds === null) {
                    return;
                }

                id = 0;
                while (Object.keys(rustplus.timers).map(Number).includes(id)) {
                    id += 1;
                }

                let message = command.slice(time.length + 1);
                if (message === "") {
                    return;
                }

                rustplus.timers[id] = {
                    timer: new Timer.timer(
                        () => {
                            rustplus.sendTeamMessage(`Timer: ${message}`);
                            rustplus.log('TIMER', message);
                            delete rustplus.timers[id]
                        },
                        timeSeconds * 1000),
                    message: message
                };
                rustplus.timers[id].timer.start();

                rustplus.sendTeamMessage(`Timer set for ${time}.`);
                rustplus.log('COMMAND', `Timer set for ${time}.`);
                break;

            case 'remove':
                id = parseInt(command.replace(/ .*/, ''));
                if (id === 'NaN') {
                    return;
                }

                if (!Object.keys(rustplus.timers).map(Number).includes(id)) {
                    return;
                }

                rustplus.timers[id].timer.stop();
                delete rustplus.timers[id];

                rustplus.sendTeamMessage(`Timer with ID: ${id} was removed.`);
                rustplus.log('COMMAND', `Timer with ID: ${id} was removed.`);

                break;

            case 'remain':
                if (Object.keys(rustplus.timers).length === 0) {
                    rustplus.sendTeamMessage('No active timers.');
                    rustplus.log('COMMAND', 'No active timers');
                }
                else {
                    rustplus.sendTeamMessage('Active timers:');
                    rustplus.log('COMMAND', 'Active timers:');
                }
                for (const [id, content] of Object.entries(rustplus.timers)) {
                    let timeLeft = rustplus.getTimeLeftOfTimer(content.timer);
                    let str = `- ID: ${parseInt(id)}, Time left: ${timeLeft}, Message: ${content.message}`;
                    rustplus.sendTeamMessage(str);
                    rustplus.log('COMMAND', str);
                }
                break;

            default:
                break;
        }
    },

    commandWipe: function (rustplus) {
        rustplus.getInfo((msg) => {
            if (msg.response.hasOwnProperty('info')) {
                const wipe = new Date(msg.response.info.wipeTime * 1000);
                const now = new Date();

                const sinceWipe = Timer.secondsToFullScale((now - wipe) / 1000);

                let str = `${sinceWipe} since wipe.`;

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },
};

function promoteToLeader(rustplus, steamId) {
    return rustplus.sendRequestAsync({
        promoteToLeader: {
            steamId: steamId
        },
    }, 2000);
}