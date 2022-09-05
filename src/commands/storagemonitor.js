const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const InstanceUtils = require('../util/instanceUtils.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
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
					option.setName('image')
						.setDescription('Set the image that best represent the Storage Monitor.')
						.setRequired(false)
						.addChoices(
							{
								name: 'Storage Monitor',
								value: 'storage_monitor'
							},
							{
								name: 'Tool Cupboard',
								value: 'tool_cupboard'
							},
							{
								name: 'Large Wood Box',
								value: 'large_wood_box'
							},
							{
								name: 'Vending Machine',
								value: 'vending_machine'
							}
						))),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		const id = interaction.options.getString('id');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log('WARNING', str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				const image = interaction.options.getString('image');

				const device = InstanceUtils.getSmartDevice(interaction.guildId, id);
				if (device === null) {
					let str = `Invalid ID: '${id}'.`;
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);
					return;
				}

				if (image !== null) {
					instance.serverList[rustplus.serverId].storageMonitors[id].image = `${image}.png`;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, rustplus.serverId, id);

				let str = `Successfully edited Storage Monitor ` +
					`'${instance.serverList[rustplus.serverId].storageMonitors[id].name}'.`;
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
