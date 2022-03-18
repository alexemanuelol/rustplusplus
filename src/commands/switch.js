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
		let id = interaction.options.getString('id');
		let name = interaction.options.getString('name');
		let command = interaction.options.getString('command');
		let image = interaction.options.getString('image');

		switch (interaction.options.getSubcommand()) {
			case 'edit':
				let rustplus = client.rustplusInstances[interaction.guildId];
				if (!rustplus) {
					interaction.reply({
						content: 'No active rustplus instance.',
						ephemeral: true
					});
					return;
				}

				if (!Object.keys(instance.switches).includes(id)) {
					interaction.reply({
						content: 'Invalid ID.',
						ephemeral: true
					});
					return;
				}

				if (instance.switches[id].ipPort !== `${rustplus.server}-${rustplus.port}`) {
					interaction.reply({
						content: 'That Smart Switch is not part of this Rust Server.',
						ephemeral: true
					});
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

				let active = instance.switches[id].active;
				let prefix = rustplus.generalSettings.prefix;
				let sw = instance.switches[id];

				let file = new MessageAttachment(`src/images/electrics/${instance.switches[id].image}`);
				let embed = DiscordTools.getSwitchButtonsEmbed(id, sw, prefix);

				let row = DiscordTools.getSwitchButtonsRow(id, active);

				client.switchesMessages[interaction.guildId][id].edit({
					embeds: [embed], components: [row], files: [file]
				});

				interaction.reply({
					content: 'Successfully edited Smart Switch.',
					ephemeral: true
				});
				break;

			default:
				break;
		}
	},
};
