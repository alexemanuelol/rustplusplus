module.exports = {
    inGameCommandHandler: function (rustplus, client, command) {
        const prefix = '!';

        if (command.startsWith(prefix + 'alarm')) {
            console.log('ALARM');
        }
        else if (command === (prefix + 'bradley')) {
            console.log('BRADLEY');
        }
        else if (command.startsWith(prefix + 'leader')) {
            console.log('LEADER');
        }
        else if (command === (prefix + 'pop')) {
            console.log('POP');
        }
        else if (command === (prefix + 'time')) {
            console.log('TIME');
        }
        else if (command === (prefix + 'wipe')) {
            console.log('WIPE');
        }
    },
};