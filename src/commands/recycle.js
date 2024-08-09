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
	name: 'recycle',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('recycle')
			.setDescription(client.intlGet(guildId, 'commandsRecycleDesc'))
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
				.setDescription(client.intlGet(guildId, 'commandsRecycleQuantityDesc'))
				.setRequired(false))
			.addStringOption(option => option
				.setName('recycler-type')
				.setDescription(client.intlGet(guildId, 'commandsRecycleRecyclerTypeDesc'))
				.setRequired(false)
				.addChoices(
					{ name: client.intlGet(guildId, 'recycler'), value: 'recycler' },
					{ name: client.intlGet(guildId, 'shredder'), value: 'shredder' },
					{ name: client.intlGet(guildId, 'safe-zone-recycler'), value: 'safe-zone-recycler' }));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const recycleItemName = interaction.options.getString('name');
		const recycleItemId = interaction.options.getString('id');
		const recycleItemQuantity = interaction.options.getInteger('quantity');
		const recycleItemRecyclerType = interaction.options.getString('recycler-type');

		let itemId = null;
		if (recycleItemName !== null) {
			const item = client.items.getClosestItemIdByName(recycleItemName)
			if (item === null) {
				const str = client.intlGet(guildId, 'noItemWithNameFound', {
					name: recycleItemName
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
			else {
				itemId = item;
			}
		}
		else if (recycleItemId !== null) {
			if (client.items.itemExist(recycleItemId)) {
				itemId = recycleItemId;
			}
			else {
				const str = client.intlGet(guildId, 'noItemWithIdFound', {
					id: recycleItemId
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
		}
		else if (recycleItemName === null && recycleItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}
		const itemName = client.items.getName(itemId);

		const recycleDetails = client.rustlabs.getRecycleDetailsById(itemId);
		if (recycleDetails === null) {
			const str = client.intlGet(guildId, 'couldNotFindRecycleDetails', {
				name: itemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		const quantity = recycleItemQuantity === null ? 1 : recycleItemQuantity;
		const recyclerType = recycleItemRecyclerType === null ? 'recycler' : recycleItemRecyclerType;

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${recycleItemName} ${recycleItemId} ${recycleItemQuantity} ${recycleItemRecyclerType}`
		}));

		await DiscordMessages.sendRecycleMessage(interaction, recycleDetails, quantity, recyclerType);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(guildId, 'commandsRecycleDesc'));
	},
};
