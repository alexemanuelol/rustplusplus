module.exports = {
    name: 'request',
    async execute(rustplus, client, request) {
        if (rustplus.debug)
            console.log(`REQUEST SENT:\n${JSON.stringify(request)}`);
    },
};