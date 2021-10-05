module.exports = {
    name: 'message',
    async execute(discord, rustplus, message) {
        console.log("MESSAGE RECEIVED:\n" + JSON.stringify(message));
    },
};