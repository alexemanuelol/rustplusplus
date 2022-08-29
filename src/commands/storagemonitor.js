const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Recycler = require('../util/recycler.js');

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
					option.setName('name')
						.setDescription('Rename the Storage Monitor.')
						.setRequired(false))
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
						)))
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
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log('WARNING', str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				const name = interaction.options.getString('name');
				const image = interaction.options.getString('image');

				if (!Object.keys(instance.storageMonitors).includes(id)) {
					let str = `Invalid ID: '${id}'.`;
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);
					return;
				}

				if (instance.storageMonitors[id].serverId !== rustplus.serverId) {
					let str = 'That Storage Monitor is not part of this Rust Server.';
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);
					return;
				}

				if (name !== null) {
					instance.storageMonitors[id].name = name;
				}
				if (image !== null) {
					instance.storageMonitors[id].image = `${image}.png`;
				}
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, id);

				let str = `Successfully edited Storage Monitor '${instance.storageMonitors[id].name}'.`;
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('INFO', str);
			} break;

			case 'recycle': {
				if (!Object.keys(instance.storageMonitors).includes(id)) {
					let str = `Invalid ID: '${id}'.`;
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);
					return;
				}

				if (instance.storageMonitors[id].serverId !== rustplus.serverId) {
					let str = 'That Storage Monitor is not part of this Rust Server.';
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);
					return;
				}

				let entityInfo = await rustplus.getEntityInfoAsync(id);
				if (!(await rustplus.isResponseValid(entityInfo))) {
					instance.storageMonitors[id].reachable = false;
					client.writeInstanceFile(interaction.guildId, instance);

					let str = `Could not get items from Storage Monitor: ${id}`;
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log('WARNING', str);

					await DiscordMessages.sendStorageMonitorMessage(rustplus.guildId, id);
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

				let file = new Discord.AttachmentBuilder('src/resources/images/electrics/recycler.png');
				const embed = DiscordEmbeds.getEmbed({
					title: 'Result of recycling:',
					color: '#ce412b',
					thumbnail: 'attachment://recycler.png',
					footer: { text: `${instance.storageMonitors[id].server}` },
					description: `**Name** \`${instance.storageMonitors[id].name}\`\n**ID** \`${id}\``
				});

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
