const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds');
const DiscordTools = require('../discordTools/discordTools');

module.exports = {
	name: 'role',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('role')
			.setDescription(client.intlGet(guildId, 'commandsRoleDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('set')
				.setDescription(client.intlGet(guildId, 'commandsRoleSetDesc'))
				.addRoleOption(option => option
					.setName('role')
					.setDescription(client.intlGet(guildId, 'commandsRoleSetRoleDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('clear')
				.setDescription(client.intlGet(guildId, 'commandsRoleClearDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		let role = null;
		switch (interaction.options.getSubcommand()) {
			case 'set': {
				role = interaction.options.getRole('role');
				instance.role = role.id;
				client.setInstance(interaction.guildId, instance);

			} break;

			case 'clear': {
				instance.role = null;
				client.setInstance(interaction.guildId, instance);

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
			const str = client.intlGet(interaction.guildId, 'roleSet', { name: role.name });
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
			client.log(client.intlGet(null, 'infoCap'), str);
		}
		else {
			const str = client.intlGet(interaction.guildId, 'roleCleared');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
			client.log(client.intlGet(null, 'infoCap'), str);
		}
	},
};
