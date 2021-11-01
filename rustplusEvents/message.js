module.exports = {
    name: 'message',
    async execute(rustplus, message) {
        if (rustplus.debug)
            console.log(`MESSAGE RECEIVED:\n${JSON.stringify(message)}`);
    },
};