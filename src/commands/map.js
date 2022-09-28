const Builder = require('@discordjs/builders');
const Discord = require('discord.js');
const Path = require('path');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'map',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('map')
			.setDescription(client.intlGet(guildId, 'commandsMapDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('all')
				.setDescription(client.intlGet(guildId, 'commandsMapAllDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('clean')
				.setDescription(client.intlGet(guildId, 'commandsMapCleanDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('monuments')
				.setDescription(client.intlGet(guildId, 'commandsMapMonumentsDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('markers')
				.setDescription(client.intlGet(guildId, 'commandsMapMarkersDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
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
			file = new Discord.AttachmentBuilder(
				Path.join(__dirname, '..', `resources/images/maps/${interaction.guildId}_map_clean.png`));
		}
		else {
			file = new Discord.AttachmentBuilder(
				Path.join(__dirname, '..', `resources/images/maps/${interaction.guildId}_map_full.png`));
		}

		const fileName = (interaction.options.getSubcommand() === 'clean') ? 'clean' : 'full';
		await client.interactionEditReply(interaction, {
			embeds: [DiscordEmbeds.getEmbed({
				color: '#ce412b',
				image: `attachment://${interaction.guildId}_map_${fileName}.png`,
				footer: { text: instance.serverList[rustplus.serverId].title }
			})],
			files: [file],
			ephemeral: true
		});
		rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), client.intlGet(interaction.guildId,
			'displayingMap', { mapName: fileName }));
	},
};