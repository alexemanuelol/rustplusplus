const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Get currently connected server map.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('Get the map including both monument names and markers.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('clean')
				.setDescription('Get the clean map.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('monuments')
				.setDescription('Get the map including monument names.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('markers')
				.setDescription('Get the map including markers.')),

	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			await interaction.editReply({
				content: 'No active rustplus instance.',
				ephemeral: true
			});
			client.log('WARNING', 'No active rustplus instance.');
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'all': {
				await rustplus.map.writeMap(true, true);
			} break;

			case 'clean': {
				/* Do nothing */
			} break;

			case 'monuments': {
				await rustplus.map.writeMap(false, true);
			} break;

			case 'markers': {
				await rustplus.map.writeMap(true, false);
			} break;

			default: {
			} break;
		}

		let file = null;
		if (interaction.options.getSubcommand() === 'clean') {
			file = new MessageAttachment(`src/resources/images/maps/${interaction.guildId}_map_clean.png`);
		}
		else {
			file = new MessageAttachment(`src/resources/images/maps/${interaction.guildId}_map_full.png`);
		}

		await interaction.editReply({
			files: [file],
			ephemeral: true
		});
	},
};
