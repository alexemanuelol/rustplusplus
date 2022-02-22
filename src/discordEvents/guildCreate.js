const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        let instance = client.readInstanceFile(guild.id);

        require('../util/CreateInstanceFile')(client, guild);
        require('../util/CreateCredentialsFile')(client, guild);
        require('../discordTools/RegisterSlashCommands')(client, guild);

        /* TODO: Wait for all text channels to be created before continue */
        require('../discordTools/SetupGuildChannels')(client, guild);
        client.log('INFO', `Waiting 5 seconds to make sure all text channels are created in guild: ${guild.id}`);

        setTimeout(() => {
            require('../discordTools/SetupSettingsMenu')(client, guild);
            DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);
            client.informationMessages[guild.id] = {};
        }, 5000);
    },
}