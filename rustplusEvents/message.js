module.exports = {
    name: 'message',
    async execute(rustplus, client, message) {
        if (rustplus.debug)
            console.log(`MESSAGE RECEIVED:\n${JSON.stringify(message)}`);
    },
};