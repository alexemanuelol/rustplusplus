const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const InstanceUtils = require('../util/instanceUtils.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('storagemonitor')
		.setDescription('Operations on Storage Monitors.')
		.addSubcommand(subcommand => subcommand
			.setName('edit')
			.setDescription('Edit the properties of a Storage Monitor.')
			.addStringOption(option => option
				.setName('id')
				.setDescription('The ID of the Storage Monitor.')
				.setRequired(true))
			.addStringOption(option => option
				.setName('image')
				.setDescription('Set the image that best represent the Storage Monitor.')
				.setRequired(false)
				.addChoices(
					{ name: 'Storage Monitor', value: 'storage_monitor' },
					{ name: 'Tool Cupboard', value: 'tool_cupboard' },
					{ name: 'Large Wood Box', value: 'large_wood_box' },
					{ name: 'Vending Machine', value: 'vending_machine' }
				))),

	async execute(client, interaction) {
		const instance = client.readInstanceFile(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				const entityId = interaction.options.getString('id');
				const image = interaction.options.getString('image');

				const device = InstanceUtils.getSmartDevice(interaction.guildId, entityId);
				if (device === null) {
					let str = `Invalid ID: '${entityId}'.`;
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[device.serverId].title));
					client.log('WARNING', str);
					return;
				}

				const entity = instance.serverList[device.serverId].storageMonitors[entityId];

				if (image !== null) {
					instance.serverList[device.serverId].storageMonitors[entityId].image = `${image}.png`;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				if (rustplus && rustplus.serverId === device.serverId) {
					await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, device.serverId, entityId);
				}

				let str = `Successfully edited Storage Monitor '${entity.name}'.`;
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[device.serverId].title));
				client.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
