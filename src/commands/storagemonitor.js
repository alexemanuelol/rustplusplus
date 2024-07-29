/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

import { log } from '../../index';
import * as discordEmbeds from '../discordTools/discord-embeds';
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
	name: 'storagemonitor',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('storagemonitor')
			.setDescription(client.intlGet(guildId, 'commandsStoragemonitorDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('edit')
				.setDescription(client.intlGet(guildId, 'commandsStoragemonitorEditDesc'))
				.addStringOption(option => option
					.setName('id')
					.setDescription(client.intlGet(guildId, 'commandsStoragemonitorEditIdDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('image')
					.setDescription(client.intlGet(guildId, 'commandsStoragemonitorEditImageDesc'))
					.setRequired(true)
					.addChoices(
						{ name: client.intlGet(guildId, 'storageMonitor'), value: 'storage_monitor' },
						{ name: client.intlGet(guildId, 'toolCupboard'), value: 'tool_cupboard' },
						{ name: client.intlGet(guildId, 'largeWoodBox'), value: 'large_wood_box' },
						{ name: client.intlGet(guildId, 'vendingMachine'), value: 'vending_machine' })));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;
		const instance = client.getInstance(guildId);
		const rustplus = client.rustplusInstances[guildId];

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		await client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'edit': {
				const entityId = interaction.options.getString('id');
				const image = interaction.options.getString('image');

				const device = client.getSmartDevice(guildId, entityId);
				if (device === null) {
					const str = client.intlGet(guildId, 'invalidId', { id: entityId });
					await client.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str));
					log.warn(str);
					return;
				}

				const entity = instance.serverList[device.serverId].storageMonitors[entityId];

				if (image !== null) {
					instance.serverList[device.serverId].storageMonitors[entityId].image = `${image}.png`;
				}
				client.setInstance(guildId, instance);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `edit, ${entityId}, ${image}.png`
				}));

				if (rustplus && rustplus.serverId === device.serverId) {
					await DiscordMessages.sendStorageMonitorMessage(guildId, device.serverId, entityId);
				}

				const str = client.intlGet(guildId, 'storageMonitorEditSuccess', { name: entity.name });
				await client.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[device.serverId].title));
				log.info(str);
			} break;

			default: {
			} break;
		}
	},
};
