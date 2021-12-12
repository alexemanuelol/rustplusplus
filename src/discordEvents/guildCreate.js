module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        client.createInstanceFiles();

        require('../discordTools/RegisterSlashCommands')(client, guild);
        require('../discordTools/SetupGuildChannels')(client, guild);
        require('../discordTools/SetupSettingsMenu')(client, guild);
    },
}