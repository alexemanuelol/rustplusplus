const CommandHandler = require('../inGameEvents/inGameCommandHandler.js');

module.exports = {
    name: 'message',
    async execute(rustplus, client, message) {
        if (rustplus.debug)
            rustplus.log(`MESSAGE RECEIVED:\n${JSON.stringify(message)}`);

        if (message.hasOwnProperty('response')) {

        }
        else if (message.hasOwnProperty('broadcast')) {
            if (message.broadcast.hasOwnProperty('teamChanged')) {

            }
            else if (message.broadcast.hasOwnProperty('teamMessage')) {
                /* Let command handler handle the potential command */
                CommandHandler.inGameCommandHandler(rustplus, client, message.broadcast.teamMessage.message.message);
            }
            else if (message.broadcast.hasOwnProperty('entityChanged')) {

            }
        }
    },
};