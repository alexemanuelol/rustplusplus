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
	name: 'stack',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('stack')
			.setDescription(client.intlGet(guildId, 'commandsStackDesc'))
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

		const stackItemName = interaction.options.getString('name');
		const stackItemId = interaction.options.getString('id');

		let itemId = null;
		if (stackItemName !== null) {
			const item = client.items.getClosestItemIdByName(stackItemName)
			if (item === null) {
				const str = client.intlGet(guildId, 'noItemWithNameFound', {
					name: stackItemName
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
			else {
				itemId = item;
			}
		}
		else if (stackItemId !== null) {
			if (client.items.itemExist(stackItemId)) {
				itemId = stackItemId;
			}
			else {
				const str = client.intlGet(guildId, 'noItemWithIdFound', {
					id: stackItemId
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
		}
		else if (stackItemName === null && stackItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}
		const itemName = client.items.getName(itemId);

		const stackDetails = client.rustlabs.getStackDetailsById(itemId);
		if (stackDetails === null) {
			const str = client.intlGet(guildId, 'couldNotFindStackDetails', {
				name: itemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		const quantity = stackDetails[2].quantity;

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${stackItemName} ${stackItemId}`
		}));

		const str = client.intlGet(guildId, 'stackSizeOfItem', {
			item: itemName,
			quantity: quantity
		});

		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		client.log(client.intlGet(null, 'infoCap'), str);
	},
};
