module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        require('../util/RegisterSlashCommands')(guild.id);
        require('../util/SetupGuildChannels')(client, guild);
    },
}