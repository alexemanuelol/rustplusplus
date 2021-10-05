module.exports = {
    name: 'request',
    async execute(discord, rustplus, request) {
        console.log("REQUEST SENT:\n" + JSON.stringify(request));
    },
};