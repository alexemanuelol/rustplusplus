module.exports = {
    name: 'request',
    async execute(rustplus, request) {
        if (rustplus.debug)
            console.log(`REQUEST SENT:\n${JSON.stringify(request)}`);
    },
};