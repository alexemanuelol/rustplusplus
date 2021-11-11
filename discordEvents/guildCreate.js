module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        require('../util/RegisterSlashCommands')(client, guild);
        require('../util/SetupGuildChannels')(client, guild);
    },
}