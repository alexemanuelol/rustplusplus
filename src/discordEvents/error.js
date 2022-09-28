module.exports = {
    name: 'error',
    async execute(client, guild, error) {
        client.log(client.intlGet(null, 'errorCap'), error, 'error');
        process.exit(1);
    },
}