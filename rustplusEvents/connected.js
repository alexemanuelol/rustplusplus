module.exports = {
    name: 'connected',
    async execute(discord, rustplus) {
        console.log('RUSTPLUS CONNECTED');
        rustplus.getInfo(); /* To trigger rustplus events, should be removed (?) */
    },
};