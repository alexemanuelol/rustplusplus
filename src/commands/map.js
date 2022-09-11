const Builder = require('@discordjs/builders');
const Discord = require('discord.js');
const Path = require('path');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('map')
		.setDescription('Get the currently connected server map image.')
		.addSubcommand(subcommand => subcommand
			.setName('all')
			.setDescription('Get the map including both monument names and markers.'))
		.addSubcommand(subcommand => subcommand
			.setName('clean')
			.setDescription('Get the clean map.'))
		.addSubcommand(subcommand => subcommand
			.setName('monuments')
			.setDescription('Get the map including monument names.'))
		.addSubcommand(subcommand => subcommand
			.setName('markers')
			.setDescription('Get the map including markers.')),

	async execute(client, interaction) {
		const instance = client.readInstanceFile(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log('WARNING', str);
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
		rustplus.log('INFO', `Displaying ${fileName} map.`);
	},
};