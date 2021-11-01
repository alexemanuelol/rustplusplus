const Main = require('./../index.js');

module.exports = {
    name: 'message',
    async execute(rustplus, message) {
        if (Main.debug)
            console.log(`MESSAGE RECEIVED:\n${JSON.stringify(message)}`);
    },
};