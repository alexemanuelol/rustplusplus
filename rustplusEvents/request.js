const Main = require('./../index.js');

module.exports = {
    name: 'request',
    async execute(discord, rustplus, request) {
        if (Main.debug)
            console.log(`REQUEST SENT:\n${JSON.stringify(request)}`);
    },
};