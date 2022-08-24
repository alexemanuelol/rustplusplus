const Builder = require('@discordjs/builders');

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('alarm')
		.setDescription('Operations on Smart Alarms.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('edit')
				.setDescription('Edit the properties of a Smart Alarm.')
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The ID of the Smart Alarm.')
						.setRequired(true))
				.addStringOption(option =>
					option.setName('name')
						.setDescription('Rename the Smart Alarm.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('message')
						.setDescription('Set the Smart Alarm notification message.')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('image')
						.setDescription('Set the image that best represent the Smart Alarm.')
						.setRequired(false)
						.addChoices(
							{
								name: 'Autoturret',
								value: 'autoturret'
							},
							{
								name: 'Boom Box',
								value: 'boombox'
							},
							{
								name: 'Broadcaster',
								value: 'broadcaster'
							},
							{
								name: 'Ceiling Light',
								value: 'ceiling_light'
							},
							{
								name: 'Discofloor',
								value: 'discofloor'
							},
							{
								name: 'Door Controller',
								value: 'door_controller'
							},
							{
								name: 'Elevator',
								value: 'elevator'
							},
							{
								name: 'HBHF Sensor',
								value: 'hbhf_sensor'
							},
							{
								name: 'Heater',
								value: 'heater'
							},
							{
								name: 'SAM site',
								value: 'samsite'
							},
							{
								name: 'Siren Light',
								value: 'siren_light'
							},
							{
								name: 'Smart Alarm',
								value: 'smart_alarm'
							},
							{
								name: 'Smart Switch',
								value: 'smart_switch'
							},
							{
								name: 'Sprinkler',
								value: 'sprinkler'
							},
							{
								name: 'Storage Monitor',
								value: 'storage_monitor'
							},
							{
								name: 'Christmas Lights',
								value: 'xmas_light'
							}
						))),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		const id = interaction.options.getString('id');
		const name = interaction.options.getString('name');
		const message = interaction.options.getString('message');
		const image = interaction.options.getString('image');

		let embedChanged = false;
		let filesChanged = false;

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				if (!Object.keys(instance.alarms).includes(id)) {
					let str = `Invalid ID: '${id}'.`;
					await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
					client.log('WARNING', str);
					return;
				}

				if (name !== null) {
					instance.alarms[id].name = name;
					embedChanged = true;
				}
				if (message !== null) {
					instance.alarms[id].message = message;
					embedChanged = true;
				}
				if (image !== null) {
					instance.alarms[id].image = `${image}.png`;
					embedChanged = true;
					filesChanged = true;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordTools.sendSmartAlarmMessage(interaction.guildId, id, embedChanged, false, filesChanged);

				let str = `Successfully edited Smart Alarm '${instance.alarms[id].name}'.`;
				await client.interactionEditReply(interaction, client.getEmbedActionInfo(0, str));
				client.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
