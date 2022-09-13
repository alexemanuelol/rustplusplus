const Path = require('path');

const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');
const config = require('../../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.log('INFO', `Logged in as: ${client.user.tag}`);
        try {
            await client.user.setUsername(config.discord.username);
        }
        catch (e) {
            client.log('INFO', 'Failed to change username.');
        }

        try {
            await client.user.setAvatar(Path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
        }
        catch (e) {
            client.log('INFO', 'Ignored changing avatar.');
        }

        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            await client.setupGuild(guild);
        });

        BattlemetricsHandler.handler(client);
        client.battlemetricsIntervalId = setInterval(
            BattlemetricsHandler.handler,
            60000,
            client);

        client.createRustplusInstancesFromConfig();
    },
};