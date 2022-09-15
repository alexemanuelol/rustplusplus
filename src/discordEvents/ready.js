const Path = require('path');

const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');
const config = require('../../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);

        try {
            await client.user.setUsername('rustPlusPlus');
        }
        catch (e) {
            client.log('WARNING', 'Ignored setUsername.');
        }

        try {
            await client.user.setAvatar(Path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
        }
        catch (e) {
            client.log('WARNING', 'Ignored setAvatar.');
        }

        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.me.setNickname('rustPlusPlus');
            }
            catch (e) {
                client.log('WARNING', 'Ignored setNickname.');
            }
            await client.setupGuild(guild);
        });

        BattlemetricsHandler.handler(client);
        client.battlemetricsIntervalId = setInterval(BattlemetricsHandler.handler, 60000, client);

        client.createRustplusInstancesFromConfig();
    },
};