/*
	Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.

	https://github.com/alexemanuelol/rustplusplus

*/

const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'upkeep',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('upkeep')
			.setDescription(client.intlGet(guildId, 'commandsUpkeepDesc'))
			.addStringOption(option => option
				.setName('name')
				.setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
				.setRequired(false))
			.addStringOption(option => option
				.setName('id')
				.setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
				.setRequired(false));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const upkeepItemName = interaction.options.getString('name');
		const upkeepItemId = interaction.options.getString('id');

		let itemId = null;
		let type = 'items';

		if (upkeepItemName !== null) {
			let foundName = null;
			if (!foundName) {
				foundName = client.rustlabs.getClosestOtherNameByName(upkeepItemName);
				if (foundName) {
					if (client.rustlabs.upkeepData['other'].hasOwnProperty(foundName)) {
						type = 'other';
					}
					else {
						foundName = null;
					}
				}
			}

			if (!foundName) {
				foundName = client.rustlabs.getClosestBuildingBlockNameByName(upkeepItemName);
				if (foundName) {
					if (client.rustlabs.upkeepData['buildingBlocks'].hasOwnProperty(foundName)) {
						type = 'buildingBlocks';
					}
					else {
						foundName = null;
					}
				}
			}

			if (!foundName) {
				foundName = client.items.getClosestItemIdByName(upkeepItemName);
				if (foundName) {
					if (!client.rustlabs.upkeepData['items'].hasOwnProperty(foundName)) {
						foundName = null;
					}
				}
			}

			if (!foundName) {
				const str = client.intlGet(guildId, 'noItemWithNameFound', {
					name: upkeepItemName
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
			itemId = foundName;
		}
		else if (upkeepItemId !== null) {
			if (client.items.itemExist(upkeepItemId)) {
				itemId = upkeepItemId;
			}
			else {
				const str = client.intlGet(guildId, 'noItemWithIdFound', {
					id: upkeepItemId
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
		}
		else if (upkeepItemName === null && upkeepItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		let itemName = null;
		let upkeepDetails = null;
		if (type === 'items') {
			itemName = client.items.getName(itemId);
			upkeepDetails = client.rustlabs.getUpkeepDetailsById(itemId);
		}
		else {
			itemName = itemId;
			upkeepDetails = client.rustlabs.getUpkeepDetailsByName(itemId);
		}

		if (upkeepDetails === null) {
			const str = client.intlGet(guildId, 'couldNotFindUpkeepDetails', {
				name: itemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		const details = upkeepDetails[3];

		const items = [];
		for (const item of details) {
			const name = client.items.getName(item.id);
			const quantity = item.quantity;
			items.push(`${quantity} ${name}`);
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${upkeepItemName} ${upkeepItemId}`
		}));

		const str = client.intlGet(guildId, 'upkeepForItem', {
			item: itemName,
			cost: items.join(', ')
		});

		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		client.log(client.intlGet(null, 'infoCap'), str);
	},
};
