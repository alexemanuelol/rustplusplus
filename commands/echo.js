
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')),
    async execute(discord, interaction) {
        if (interaction.options.getString('input') !== null)
            await interaction.reply(interaction.options.getString('input'));
        else
            await interaction.reply('Nothing to echo...');
    },
};
