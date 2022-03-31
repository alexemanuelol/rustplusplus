module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);
        client.user.setUsername('rustPlusPlus');

        try {
            await client.user.setAvatar('./src/resources/images/rustplusplus_logo.png');
        }
        catch (e) {
            client.log('INFO', 'Ignored changing avatar.');
        }

        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            guild.me.setNickname('rustPlusPlus');
            await client.setupGuild(guild);
        });

        client.createRustplusInstancesFromConfig();
    },
};