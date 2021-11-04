const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		await interaction.reply('HAH! No help for you! >:)');
	},
};
