module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        await client.setupGuild(guild);
    },
}