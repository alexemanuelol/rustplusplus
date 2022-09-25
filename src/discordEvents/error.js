module.exports = {
    name: 'error',
    async execute(client, guild, error) {
        client.log(client.intlGet(null, 'error'), error, 'error');
        process.exit(1);
    },
}