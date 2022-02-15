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
						.setRequired(false))),
	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);
		let id = interaction.options.getString('id');
		let name = interaction.options.getString('name');
		let command = interaction.options.getString('command');

		switch (interaction.options.getSubcommand()) {
			case 'edit':
				if (!Object.keys(instance.switches).includes(id)) {
					interaction.reply('Invalid ID.');
					return;
				}

				if (name !== null) {
					instance.switches[id].name = name;
				}

				if (command !== null) {
					instance.switches[id].command = command;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				let active = instance.switches[id].active;
				let prefix = client.rustplusInstances[interaction.guildId].generalSettings.prefix;
				let file = new MessageAttachment(`src/images/${(active) ? 'on_logo.png' : 'off_logo.png'}`);
				let embed = DiscordTools.getSwitchButtonsEmbed(
					id,
					instance.switches[id].name,
					`${prefix}${instance.switches[id].command}`,
					instance.switches[id].server,
					active);

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
