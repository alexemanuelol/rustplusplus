const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('lodash');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Set bot channels for management, events, chat, etc.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Start the setup process in the current channel')
                .addChannelOption(option => option
                    .setName('channel-name')
                    .setDescription('Optional channel (instead to current) to use to display settings & servers')
                    .setRequired(false))),
    async execute(client, interaction) {
        const instance = client.readInstanceFile(interaction.guildId);

        switch (interaction.options.getSubcommand()) {
            case 'setup':
                let channel = interaction.options.getChannel('channel-name');
                if (channel === null) {
                    channel = interaction.channel;
                }
                instance.channelId.settings = channel.id
                client.writeInstanceFile(interaction.guildId, instance);

                // Reset the channel
                require('../discordTools/SetupSettingsMenu')(client, interaction.guild);

                interaction.reply({
                    content: 'Resetting setting channel!',
                    ephemeral: true
                });
                client.log('Resetting setting channel!');
                break;

            default:
                break;
        }
    },
};