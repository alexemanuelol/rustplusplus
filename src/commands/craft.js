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
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
	name: 'craft',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('craft')
			.setDescription(client.intlGet(guildId, 'commandsCraftDesc'))
			.addStringOption(option => option
				.setName('name')
				.setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
				.setRequired(false))
			.addStringOption(option => option
				.setName('id')
				.setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
				.setRequired(false))
			.addIntegerOption(option => option
				.setName('quantity')
				.setDescription(client.intlGet(guildId, 'commandsCraftQuantityDesc'))
				.setRequired(false));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const craftItemName = interaction.options.getString('name');
		const craftItemId = interaction.options.getString('id');
		const craftItemQuantity = interaction.options.getInteger('quantity');

		let itemId = null;
		if (craftItemName !== null) {
			const item = client.items.getClosestItemIdByName(craftItemName)
			if (item === null) {
				const str = client.intlGet(guildId, 'noItemWithNameFound', {
					name: craftItemName
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
			else {
				itemId = item;
			}
		}
		else if (craftItemId !== null) {
			if (client.items.itemExist(craftItemId)) {
				itemId = craftItemId;
			}
			else {
				const str = client.intlGet(guildId, 'noItemWithIdFound', {
					id: craftItemId
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
		}
		else if (craftItemName === null && craftItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}
		const itemName = client.items.getName(itemId);

		const craftDetails = client.rustlabs.getCraftDetailsById(itemId);
		if (craftDetails === null) {
			const str = client.intlGet(guildId, 'couldNotFindCraftDetails', {
				name: itemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		const quantity = craftItemQuantity === null ? 1 : craftItemQuantity;

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${craftItemName} ${craftItemId} ${craftItemQuantity}`
		}));

		await DiscordMessages.sendCraftMessage(interaction, craftDetails, quantity);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(guildId, 'commandsCraftDesc'));
	},
};
