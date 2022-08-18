const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('map')
		.setDescription('Get the currently connected server map image.')
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
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, {
				embeds: [new EmbedBuilder()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
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
			file = new AttachmentBuilder(`src/resources/images/maps/${interaction.guildId}_map_clean.png`);
		}
		else {
			file = new AttachmentBuilder(`src/resources/images/maps/${interaction.guildId}_map_full.png`);
		}

		let fileName = (interaction.options.getSubcommand() === 'clean') ? 'clean' : 'full';
		await client.interactionEditReply(interaction, {
			embeds: [new EmbedBuilder()
				.setColor('#ce412b')
				.setImage(`attachment://${interaction.guildId}_map_${fileName}.png`)
				.setFooter({ text: instance.serverList[rustplus.serverId].title })],
			files: [file],
			ephemeral: true
		});
		rustplus.log('INFO', `Displaying ${fileName} map.`);
	},
};
