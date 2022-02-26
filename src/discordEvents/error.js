module.exports = {
    name: 'error',
    async execute(client, guild, error) {
        client.log('ERROR', JSON.stringify(error), 'error');
        process.exit(1);
    },
}