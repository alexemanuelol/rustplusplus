const CommandHandler = require('../handlers/inGameCommandHandler.js');

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
                const handled = CommandHandler.inGameCommandHandler(rustplus, client, message);

                if (handled === false) {
                    /* If the command was not handled, lets relay to chat */
                    const { message, name } = message.broadcast.teamMessage.message;
                    rustplus.sendChatMessage(`${name}: ${message}`);
                }
                
            }
            else if (message.broadcast.hasOwnProperty('entityChanged')) {

            }
        }
    },
};