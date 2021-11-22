const Timer = require('../util/timer');

module.exports = {
    inGameCommandHandler: function (rustplus, client, command) {
        const prefix = '!';

        if (command.startsWith(prefix + 'alarm')) {
            module.exports.commandAlarm(rustplus, command);
        }
        else if (command === (prefix + 'bradley')) {
            module.exports.commandBradley(rustplus);
        }
        else if (command.startsWith(prefix + 'leader')) {
            module.exports.commandLeader(rustplus, command);
        }
        else if (command === (prefix + 'pop')) {
            module.exports.commandPop(rustplus);
        }
        else if (command === (prefix + 'time')) {
            module.exports.commandTime(rustplus);
        }
        else if (command === (prefix + 'wipe')) {
            module.exports.commandWipe(rustplus);
        }
    },

    commandAlarm: function (rustplus, command) {
        console.log('ALARM');
    },

    commandBradley: function (rustplus) {
        console.log('BRADLEY');
    },

    commandLeader: function (rustplus, command) {
        console.log('LEADER');
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
        console.log('TIME');
    },

    commandWipe: function (rustplus) {
        console.log('WIPE');
    },
};