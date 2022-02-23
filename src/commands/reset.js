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

				let category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				instance.firstTime = true;
				client.writeInstanceFile(interaction.guildId, instance);

				require('../discordTools/SetupServerList')(client, guild);
				require('../discordTools/SetupSettingsMenu')(client, guild);

				instance = client.readInstanceFile(guild.id);
				DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);
				client.informationMessages[guild.id] = {};

				interaction.reply({
					content: ':white_check_mark: Discord Reset.',
					ephemeral: true
				});
				break;

			default:
				break;
		}
	},
};
