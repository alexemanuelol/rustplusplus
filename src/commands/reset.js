const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Reset discord channels.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('discord')
				.setDescription('Reset discord channels.')),
	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		switch (interaction.options.getSubcommand()) {
			case 'discord':
				const guild = DiscordTools.getGuild(interaction.guildId);
				/* TODO: Wait for all text channels to be created before continue */
				require('../discordTools/SetupGuildChannels')(client, guild);
				client.log('Waiting 5 seconds to make sure all text channels are created in guild: ' +
					interaction.guildId);

				instance.firstTime = true;
				client.writeInstanceFile(interaction.guildId, instance);

				setTimeout(() => {
					client.log(`Creating Settings Menus for guild: ${interaction.guildId}`);
					require('../discordTools/SetupSettingsMenu')(client, guild);
				}, 5000);

				interaction.reply({
					content: ':white_check_mark: Discord channels is reseting.',
					ephemeral: true
				});
				break;

			default:
				break;
		}
	},
};
