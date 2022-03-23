const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageAttachment } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('switch')
		.setDescription('Operations on Smart Switches.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('edit')
				.setDescription('Edit the properties of a Smart Switch.')
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The ID of the Smart Switch.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Rename the Smart Switch.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('command')
						.setDescription('Set the custom command for the Smart Switch.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('image')
						.setDescription('Set the image that best represent the Smart Switch.')
						.setRequired(false)
						.addChoice('Autoturret', 'autoturret')
						.addChoice('Boom Box', 'boombox')
						.addChoice('Broadcaster', 'broadcaster')
						.addChoice('Ceiling Light', 'ceiling_light')
						.addChoice('Discofloor', 'discofloor')
						.addChoice('Door Controller', 'door_controller')
						.addChoice('Elevator', 'elevator')
						.addChoice('HBHF Sensor', 'hbhf_sensor')
						.addChoice('Heater', 'heater')
						.addChoice('SAM site', 'samsite')
						.addChoice('Siren Light', 'siren_light')
						.addChoice('Smart Alarm', 'smart_alarm')
						.addChoice('Smart Switch', 'smart_switch')
						.addChoice('Sprinkler', 'sprinkler')
						.addChoice('Storage Monitor', 'storage_monitor')
						.addChoice('Christmas Lights', 'xmas_light'))),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		await interaction.deferReply({ ephemeral: true });

		const id = interaction.options.getString('id');
		const name = interaction.options.getString('name');
		const command = interaction.options.getString('command');
		const image = interaction.options.getString('image');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			await interaction.editReply({
				content: 'No active rustplus instance.',
				ephemeral: true
			});
			client.log('WARNING', 'No active rustplus instance.');
			return;
		}

		const server = `${rustplus.server}-${rustplus.port}`;

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				if (!Object.keys(instance.switches).includes(id)) {
					await interaction.editReply({
						content: 'Invalid ID.',
						ephemeral: true
					});
					client.log('WARNING', 'Invalid ID.');
					return;
				}

				if (instance.switches[id].ipPort !== server) {
					await interaction.editReply({
						content: 'That Smart Switch is not part of this Rust Server.',
						ephemeral: true
					});
					client.log('WARNING', 'That Smart Switch is not part of this Rust Server.');
					return;
				}

				if (name !== null) {
					instance.switches[id].name = name;
				}
				if (command !== null) {
					instance.switches[id].command = command;
				}
				if (image !== null) {
					instance.switches[id].image = `${image}.png`;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				let prefix = rustplus.generalSettings.prefix;
				let sw = instance.switches[id];

				let file = new MessageAttachment(`src/images/electrics/${instance.switches[id].image}`);
				let embed = DiscordTools.getSwitchEmbed(id, sw, prefix);

				let selectMenu = DiscordTools.getSwitchSelectMenu(id, sw);
				let buttonRow = DiscordTools.getSwitchButtonsRow(id, sw);

				await client.switchesMessages[interaction.guildId][id].edit({
					embeds: [embed], components: [selectMenu, buttonRow], files: [file]
				});

				await interaction.editReply({
					content: 'Successfully edited Smart Switch.',
					ephemeral: true
				});
				client.log('INFO', 'Successfully edited Smart Switch.');
			} break;

			default: {
			} break;
		}
	},
};
