module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        require('../util/CreateInstanceFile')(client, guild);
        require('../discordTools/RegisterSlashCommands')(client, guild);
        require('../discordTools/SetupGuildChannels')(client, guild);
        require('../discordTools/SetupSettingsMenu')(client, guild);
    },
}