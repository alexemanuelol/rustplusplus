module.exports = {
    name: 'message',
    async execute(rustplus, client, message) {
        if (rustplus.debug)
            rustplus.log(`MESSAGE RECEIVED:\n${JSON.stringify(message)}`);
    },
};