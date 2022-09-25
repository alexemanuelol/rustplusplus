const Path = require('path');

const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');
const Config = require('../../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.loadGuildIntl();
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);

        try {
            await client.user.setUsername(Config.discord.username);
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

        for (const guild of client.guilds.cache) {
            require('../util/CreateInstanceFile')(client, guild[1]);
            require('../util/CreateCredentialsFile')(client, guild[1]);
        }

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.me.setNickname(Config.discord.username);
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