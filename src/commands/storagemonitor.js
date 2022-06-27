const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Recycler = require('../util/recycler.js');

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
						.addChoice('Vending Machine', 'vending_machine')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('recycle')
				.setDescription('Calculate the resources gained from recycling the content of a Storage Monitor.')
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The ID of the Storage Monitor.')
						.setRequired(true))),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		const id = interaction.options.getString('id');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
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
				const name = interaction.options.getString('name');
				const image = interaction.options.getString('image');

				let embedChanged = false;
				let filesChanged = false;

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

			case 'recycle': {
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

				let entityInfo = await rustplus.getEntityInfoAsync(id);
				if (!(await rustplus.isResponseValid(entityInfo))) {
					instance.storageMonitors[id].reachable = false;
					client.writeInstanceFile(interaction.guildId, instance);

					let str = `Could not get items from Storage Monitor: ${id}`;
					await client.interactionEditReply(interaction, {
						embeds: [new MessageEmbed()
							.setColor('#ff0040')
							.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
							.setFooter({ text: instance.serverList[rustplus.serverId].title })],
						ephemeral: true
					});
					rustplus.log('WARNING', str);

					await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, id);
					return;
				}
				instance.storageMonitors[id].reachable = true;
				client.writeInstanceFile(interaction.guildId, instance);

				let items = Recycler.calculate(entityInfo.entityInfo.payload.items);

				let itemName = '';
				let itemQuantity = '';
				for (let item of items) {
					itemName += `\`${rustplus.items.getName(item.itemId)}\`\n`;
					itemQuantity += `\`${item.quantity}\`\n`;
				}

				let file = new MessageAttachment('src/resources/images/electrics/recycler.png');
				let embed = new MessageEmbed()
					.setTitle('Result of recycling:')
					.setColor('#ce412b')
					.setThumbnail('attachment://recycler.png')
					.setFooter({ text: `${instance.storageMonitors[id].server}` })
					.setDescription(`**Name** \`${instance.storageMonitors[id].name}\`\n**ID** \`${id}\``);

				if (itemName === '' || itemQuantity === '') {
					itemName = 'Empty';
					itemQuantity = 'Empty';
				}

				embed.addFields(
					{ name: 'Item', value: itemName, inline: true },
					{ name: 'Quantity', value: itemQuantity, inline: true }
				);

				await client.interactionEditReply(interaction, {
					embeds: [embed],
					files: [file]
				});
				rustplus.log('INFO',
					`Showing result of recycling content of storage monitor '${instance.storageMonitors[id].name}'`);
			} break;

			default: {
			} break;
		}
	},
};
