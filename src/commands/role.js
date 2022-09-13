const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds');
const DiscordTools = require('../discordTools/discordTools');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('role')
		.setDescription('Set/Clear a specific role that will be able to see the rustPlusPlus category content.')
		.addSubcommand(subcommand => subcommand
			.setName('set')
			.setDescription('Set the role.')
			.addRoleOption(option => option
				.setName('role')
				.setDescription('The role rustPlusPlus channels will be visible to.')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('clear')
			.setDescription('Clear the role (to allow everyone to see the rustPlusPlus channels).')),

	async execute(client, interaction) {
		const instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		let role = null;
		switch (interaction.options.getSubcommand()) {
			case 'set': {
				role = interaction.options.getRole('role');
				instance.role = role.id;
				client.writeInstanceFile(interaction.guildId, instance);

			} break;

			case 'clear': {
				instance.role = null;
				client.writeInstanceFile(interaction.guildId, instance);

			} break;

			default: {
			} break;
		}

		const guild = DiscordTools.getGuild(interaction.guildId);
		if (guild) {
			const category = await require('../discordTools/SetupGuildCategory')(client, guild);
			await require('../discordTools/SetupGuildChannels')(client, guild, category);
		}

		if (interaction.options.getSubcommand() === 'set') {
			const str = `rustPlusPlus role has been set to '${role.name}'.`;
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
			client.log('INFO', str);
		}
		else {
			const str = 'rustPlusPlus role has been cleared.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
			client.log('INFO', str);
		}
	},
};
