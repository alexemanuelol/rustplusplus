const Path = require('path');

const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');
const Config = require('../../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        for (const guild of client.guilds.cache) {
            require('../util/CreateInstanceFile')(client, guild[1]);
            require('../util/CreateCredentialsFile')(client, guild[1]);
        }

        client.loadGuildsIntl();
        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'loggedInAs', {
            name: client.user.tag
        }));

        try {
            await client.user.setUsername(Config.discord.username);
        }
        catch (e) {
            client.log(client.intlGet(null, 'warningCap'), client.intlGet(null, 'ignoreSetUsername'));
        }

        try {
            await client.user.setAvatar(Path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
        }
        catch (e) {
            client.log(client.intlGet(null, 'warningCap'), client.intlGet(null, 'ignoreSetAvatar'));
        }

        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.me.setNickname(Config.discord.username);
            }
            catch (e) {
                client.log(client.intlGet(null, 'warningCap'), client.intlGet(null, 'ignoreSetNickname'));
            }
            await client.setupGuild(guild);
        });

        BattlemetricsHandler.handler(client);
        client.battlemetricsIntervalId = setInterval(BattlemetricsHandler.handler, 60000, client);

        client.createRustplusInstancesFromConfig();
    },
};