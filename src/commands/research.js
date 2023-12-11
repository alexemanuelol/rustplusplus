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
	name: 'research',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('research')
			.setDescription(client.intlGet(guildId, 'commandsResearchDesc'))
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

		const researchItemName = interaction.options.getString('name');
		const researchItemId = interaction.options.getString('id');

		let itemId = null;
		if (researchItemName !== null) {
			const item = client.items.getClosestItemIdByName(researchItemName)
			if (item === null) {
				const str = client.intlGet(guildId, 'noItemWithNameFound', {
					name: researchItemName
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
			else {
				itemId = item;
			}
		}
		else if (researchItemId !== null) {
			if (client.items.itemExist(researchItemId)) {
				itemId = researchItemId;
			}
			else {
				const str = client.intlGet(guildId, 'noItemWithIdFound', {
					id: researchItemId
				});
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(guildId, 'warningCap'), str);
				return;
			}
		}
		else if (researchItemName === null && researchItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}
		const itemName = client.items.getName(itemId);

		const researchDetails = client.rustlabs.getResearchDetailsById(itemId);
		if (researchDetails === null) {
			const str = client.intlGet(guildId, 'couldNotFindResearchDetails', {
				name: itemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${researchItemName} ${researchItemId}`
		}));

		await DiscordMessages.sendResearchMessage(interaction, researchDetails);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(guildId, 'commandsResearchDesc'));
	},
};
