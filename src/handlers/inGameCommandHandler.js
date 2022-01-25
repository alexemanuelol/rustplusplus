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
        else if (command.startsWith(`${rustplus.generalSettings.prefix}leader`)) {
            module.exports.commandLeader(rustplus, message);
        }
        else if (command === `${rustplus.generalSettings.prefix}pop`) {
            module.exports.commandPop(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}time`) {
            module.exports.commandTime(rustplus);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            module.exports.commandTimer(rustplus, command);
        }
        else if (command === `${rustplus.generalSettings.prefix}wipe`) {
            module.exports.commandWipe(rustplus);
        }
    },

    commandBradley: function (rustplus) {
        let times = '';
        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            let time = rustplus.getTimeLeftOfTimer(timer);

            if (time !== null) {
                if (times === '') {
                    times += time;
                }
                else {
                    times += ` and ${time}`;
                }
            }
        }

        let str;
        if (times === '') {
            str = 'Bradley APC is probably roaming around in Launch Site.';
        }
        else {
            str = `Approximately ${times} before Bradley APC respawns.`;
        }

        rustplus.sendTeamMessage(str);
        rustplus.log(str);
    },

    commandCargo: function (rustplus) {
        let times = '';
        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            let time = rustplus.getTimeLeftOfTimer(timer);

            if (time !== null) {
                if (times === '') {
                    times += time;
                }
                else {
                    times += ` and ${time}`;
                }
            }
        }

        let str;
        if (times === '') {
            str = 'Cargo Ship is not currently active.';
        }
        else {
            str = `Approximately ${times} before Cargo Ship enters egress stage.`;
        }

        rustplus.sendTeamMessage(str);
        rustplus.log(str);
    },

    commandLeader: function (rustplus, message) {
        let command = message.broadcast.teamMessage.message.message;
        let callerId = message.broadcast.teamMessage.message.steamId;
        let callerName = message.broadcast.teamMessage.message.name;

        rustplus.getTeamInfo((msg) => {
            if (msg.response.hasOwnProperty('teamInfo')) {
                if (command === `${rustplus.generalSettings.prefix}leader`) {
                    promoteToLeader(rustplus, callerId).then((result) => {
                        rustplus.log(`Team Leadership was transferred to ${callerName}:${callerId}.`);
                    }).catch((error) => {
                        rustplus.log(JSON.stringify(error));
                    });
                }
                else {
                    let name = command.replace(`${rustplus.generalSettings.prefix}leader `, '');

                    /* Look if the value provided is a steamId */
                    for (let member of msg.response.teamInfo.members) {
                        if (name == member.steamId) {
                            promoteToLeader(rustplus, member.steamId).then((result) => {
                                rustplus.log(`Team Leadership was transferred to ${member.name}:${name}.`);
                            }).catch((error) => {
                                rustplus.log(JSON.stringify(error));
                            });
                            return;
                        }
                    }

                    /* Find the closest name */
                    for (let member of msg.response.teamInfo.members) {
                        if (StringSimilarity.similarity(name, member.name) >= 0.9) {
                            promoteToLeader(rustplus, member.steamId).then((result) => {
                                rustplus.log(`Team Leadership was transferred to ${name}:` +
                                    `${member.steamId}.`);
                            }).catch((error) => {
                                rustplus.log(JSON.stringify(error));
                            });
                            return;
                        }
                    }
                }
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
                rustplus.log(str);
            }
        });
    },

    commandTime: function (rustplus) {
        rustplus.getTime((msg) => {
            if (msg.response.hasOwnProperty('time')) {
                const time = Timer.convertToHoursMinutes(msg.response.time.time);

                let str = `Current in-game time: ${time}.`;

                rustplus.sendTeamMessage(str);
                rustplus.log(str);
            }
        });
    },

    commandTimer: function (rustplus, command) {
        let arguments = command.replace('!timer ', '');
        let minutes = arguments.match(/^\d+/);
        if (minutes === null) {
            rustplus.sendTeamMessage('Invalid arguments, use syntax: !timer {minutes} {message}');
            rustplus.log('Invalid arguments, use syntax: !timer {minutes} {message}');
            return;
        }

        minutes = Number(minutes);
        let message = arguments.slice((minutes.toString().length) + 1);

        setTimeout(() => {
            rustplus.sendTeamMessage(`Timer: ${message}`);
            rustplus.log(`Timer: ${message}`);
        }, minutes * 60 * 1000);

        rustplus.sendTeamMessage(`Timer set for ${minutes} minutes.`);
        rustplus.log(`Timer set for ${minutes} minutes.`);
    },

    commandWipe: function (rustplus) {
        rustplus.getInfo((msg) => {
            if (msg.response.hasOwnProperty('info')) {
                const wipe = new Date(msg.response.info.wipeTime * 1000);
                const now = new Date();

                const sinceWipe = Timer.secondsToFullScale((now - wipe) / 1000);

                let str = `${sinceWipe} since wipe.`;

                rustplus.sendTeamMessage(str);
                rustplus.log(str);
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