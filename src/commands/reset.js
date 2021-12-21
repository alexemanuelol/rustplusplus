const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Reset discord channels or rustplus instance.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('discord')
				.setDescription('Reset discord channels.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('rustplus')
				.setDescription('Reset rustplus instance.')),
	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		switch (interaction.options.getSubcommand()) {
			case 'discord':
				let guild = client.guilds.cache.get(interaction.guildId);
				/* TODO: Wait for all text channels to be created before continue */
				require('../discordTools/SetupGuildChannels')(client, guild);
				client.log('Waiting 5 seconds to make sure all text channels are created in guild: ' +
					interaction.guildId);

				setTimeout(() => {
					client.log(`Creating Settings Menus for guild: ${interaction.guildId}`);
					require('../discordTools/SetupSettingsMenu')(client, guild);
				}, 5000);

				interaction.reply({
					content: ':white_check_mark: Discord channels is reseting.',
					ephemeral: true
				});
				break;

			case 'rustplus':
				if (client.rustplusInstances.hasOwnProperty(interaction.guildId)) {
					client.rustplusInstances[interaction.guildId].disconnect();
					delete client.rustplusInstances[interaction.guildId];
				}
				instance.rustplus = null;
				client.writeInstanceFile(interaction.guildId, instance);
				interaction.reply({
					content: ':white_check_mark: Rustplus instance was successfully reset.',
					ephemeral: true
				});
				break;

			default:
				break;
		}
	},
};
