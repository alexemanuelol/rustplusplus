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
	name: 'raid',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('raid')
			.setDescription(client.intlGet(guildId, 'commandsRaidDesc'))
			.addStringOption(option => option
				.setName('name')
				.setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
				.setRequired(false))
			.addStringOption(option => option
				.setName('id')
				.setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
				.setRequired(false));
	},

	

    /**
     * Group durability data by group and toolId.
     * @param {array} data The array of durability data objects.
     * @return {object} The grouped durability data.
     */
    groupDurabilityData(client, data) {
        const groupedData = {};

        for (const item of data) {
            if (item.which === 'soft') continue;

            if (!groupedData[item.group]) {
                groupedData[item.group] = {};
            }

            if (!groupedData[item.group][item.toolId]) {
                groupedData[item.group][item.toolId] = [];
            }

            groupedData[item.group][item.toolId].push({
				...item,
				'itemName': client.items.getName(item.toolId)
			});
        }

        return groupedData;
    },

	getDurabilityData(raidItemName, raidItemId, client, guildId) {
		let itemId = null;
		if (raidItemName !== null) {
			let item = null
			if (!item) {
				item = client.rustlabs.getClosestOtherNameByName(raidItemName);
			}
			
			if (!item) {
				item = client.items.getClosestItemIdByName(raidItemName);
				if(item !== null) {
					item = client.items.getName(item);
				}
			}
			
			if (!item) {
				item = client.rustlabs.getClosestBuildingBlockNameByName(raidItemName);
			}

			if (item === null) {
				return null;
			}
			else {
				itemId = item;
			}
		}
		else if (raidItemId !== null) {
			if (client.items.itemExist(raidItemId)) {
				itemId = raidItemId;
			}
			else {
				return null;
			}
		}
		const itemName = client.items.getName(itemId);

		const raidDetails = client.rustlabs.getDurabilityDetailsByName(raidItemName);
		if (raidDetails === null) {
			return null;
		}
		
		raidDetails[3] = this.groupDurabilityData(client, raidDetails[3]);
		return raidDetails;
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const raidItemName = interaction.options.getString('name');
		const raidItemId = interaction.options.getString('id');
		if (raidItemName === null && raidItemId === null) {
			const str = client.intlGet(guildId, 'noNameIdGiven');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return null;
		}
		
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${raidItemName} ${raidItemId}`
		}));

		const raidDetails = this.getDurabilityData(raidItemName, raidItemId, client, interaction);

		if (raidDetails === null) {
			const str = client.intlGet(guildId, 'noItemWithNameFound', {
				name: raidItemName
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}

		await DiscordMessages.sendRaidMessage(interaction, raidDetails);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(guildId, 'commandsRaidDesc'));
	},
};
