const Path = require('path');

const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);
        client.user.setUsername('rustPlusPlus');

        try {
            await client.user.setAvatar(Path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
        }
        catch (e) {
            client.log('INFO', 'Ignored changing avatar.');
        }

        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            guild.members.me.setNickname('rustPlusPlus');
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