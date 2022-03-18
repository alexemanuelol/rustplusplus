module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);
        client.user.setUsername('rustPlusPlus');
        client.user.setAvatar('./src/images/rustplusplus_logo.png');
        client.user.setActivity('/help', { type: 'LISTENING' });

        client.guilds.cache.forEach(async (guild) => {
            guild.me.setNickname('rustPlusPlus');
            await client.setupGuild(guild);
        });

        client.createRustplusInstancesFromConfig();
    },
};