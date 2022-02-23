const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		await interaction.reply({
			content: 'HAH! No help for you! >:)',
			ephemeral: true
		});
		client.log('INFO', 'HAH! No help for you! >:)');
	},
};
