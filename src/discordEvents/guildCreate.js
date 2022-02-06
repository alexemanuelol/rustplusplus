module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        require('../util/CreateInstanceFile')(client, guild);
        require('../discordTools/RegisterSlashCommands')(client, guild);

        /* TODO: Wait for all text channels to be created before continue */
        require('../discordTools/SetupGuildChannels')(client, guild);
        client.log('INFO', `Waiting 5 seconds to make sure all text channels are created in guild: ${guild.id}`);

        setTimeout(() => {
            require('../discordTools/SetupSettingsMenu')(client, guild);
        }, 5000);
    },
}