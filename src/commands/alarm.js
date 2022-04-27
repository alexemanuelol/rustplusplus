const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
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

		if (instance.role !== null) {
			if (!interaction.member.permissions.has('ADMINISTRATOR') &&
				!interaction.member.roles.cache.has(instance.role)) {
				let role = DiscordTools.getRole(interaction.guildId, instance.role);
				let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
				await client.interactionReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ff0040')
						.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
					ephemeral: true
				});
				client.log('WARNING', str);
				return;
			}
		}

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
					await client.interactionEditReply(interaction, {
						embeds: [new MessageEmbed()
							.setColor('#ff0040')
							.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
						ephemeral: true
					});
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
				await client.interactionEditReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ce412b')
						.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
					ephemeral: true
				});
				client.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
