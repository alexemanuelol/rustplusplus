const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('storagemonitor')
		.setDescription('Operations on Storage Monitors.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('edit')
				.setDescription('Edit the properties of a Storage Monitor.')
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The ID of the Storage Monitor.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Rename the Storage Monitor.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('image')
						.setDescription('Set the image that best represent the Storage Monitor.')
						.setRequired(false)
						.addChoice('Storage Monitor', 'storage_monitor')
						.addChoice('Tool Cupboard', 'tool_cupboard')
						.addChoice('Large Wood Box', 'large_wood_box')
						.addChoice('Vending Machine', 'vending_machine'))),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		await interaction.deferReply({ ephemeral: true });

		const id = interaction.options.getString('id');
		const name = interaction.options.getString('name');
		const image = interaction.options.getString('image');

		let embedChanged = false;
		let filesChanged = false;

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			await interaction.editReply({
				content: 'No active rustplus instance.',
				ephemeral: true
			});
			client.log('WARNING', 'No active rustplus instance.');
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				if (!Object.keys(instance.storageMonitors).includes(id)) {
					await interaction.editReply({
						content: 'Invalid ID.',
						ephemeral: true
					});
					client.log('WARNING', 'Invalid ID.');
					return;
				}

				if (instance.storageMonitors[id].serverId !== rustplus.serverId) {
					await interaction.editReply({
						content: 'That Storage Monitor is not part of this Rust Server.',
						ephemeral: true
					});
					client.log('WARNING', 'That Storage Monitor is not part of this Rust Server.');
					return;
				}

				if (name !== null) {
					instance.storageMonitors[id].name = name;
					embedChanged = true;
				}
				if (image !== null) {
					instance.storageMonitors[id].image = `${image}.png`;
					embedChanged = true;
					filesChanged = true;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordTools.sendStorageMonitorMessage(
					interaction.guildId, id, embedChanged, false, filesChanged);

				await interaction.editReply({
					content: 'Successfully edited Storage Monitor.',
					ephemeral: true
				});
				client.log('INFO', 'Successfully edited Storage Monitor.');
			} break;

			default: {
			} break;
		}
	},
};
