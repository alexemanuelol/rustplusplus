module.exports = {
    name: 'error',
    async execute(client, guild, error) {
        client.log('ERROR', error, 'error');
        process.exit(1);
    },
}