const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

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
		const image = interaction.options.getString('image');

		let embedChanged = false;
		let filesChanged = false;

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('WARNING', str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				if (!Object.keys(instance.storageMonitors).includes(id)) {
					let str = `Invalid ID: '${id}'.`;
					await client.interactionEditReply(interaction, {
						embeds: [new MessageEmbed()
							.setColor('#ff0040')
							.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
							.setFooter({ text: instance.serverList[rustplus.serverId].title })],
						ephemeral: true
					});
					rustplus.log('WARNING', str);
					return;
				}

				if (instance.storageMonitors[id].serverId !== rustplus.serverId) {
					let str = 'That Storage Monitor is not part of this Rust Server.';
					await client.interactionEditReply(interaction, {
						embeds: [new MessageEmbed()
							.setColor('#ff0040')
							.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
							.setFooter({ text: instance.serverList[rustplus.serverId].title })],
						ephemeral: true
					});
					rustplus.log('WARNING', str);
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

				let str = `Successfully edited Storage Monitor '${instance.storageMonitors[id].name}'.`;
				await client.interactionEditReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ce412b')
						.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
						.setFooter({ text: instance.serverList[rustplus.serverId].title })],
					ephemeral: true
				});
				rustplus.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
