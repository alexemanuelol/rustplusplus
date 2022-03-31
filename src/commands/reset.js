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

		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
				const guild = DiscordTools.getGuild(interaction.guildId);

				instance.firstTime = true;
				client.writeInstanceFile(interaction.guildId, instance);

				let category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				await require('../discordTools/SetupServerList')(client, guild);
				await require('../discordTools/SetupSettingsMenu')(client, guild);

				instance = client.readInstanceFile(interaction.guildId);
				instance.informationMessageId.server = null;
				instance.informationMessageId.event = null;
				instance.informationMessageId.team = null;
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);

				await interaction.editReply({
					content: ':white_check_mark: Discord Reset.',
					ephemeral: true
				});
				client.log('INFO', 'Discord Reset.');
			} break;

			default: {
			} break;
		}
	},
};
