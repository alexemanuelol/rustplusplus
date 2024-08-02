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
import { setupGuildCategory } from '../discordTools/setup-guild-category';
import { setupGuildChannels } from '../discordTools/setup-guild-channels';
import { resetPermissionsAllChannels } from '../handlers/permission-handler';
import * as discordEmbeds from '../discordTools/discord-embeds';
import * as discordTools from '../discordTools/discord-tools';

module.exports = {
	name: 'role',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('role')
			.setDescription(client.intlGet(guildId, 'commandsRoleDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('set')
				.setDescription(client.intlGet(guildId, 'commandsRoleSetDesc'))
				.addRoleOption(option => option
					.setName('role')
					.setDescription(client.intlGet(guildId, 'commandsRoleSetRoleDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('clear')
				.setDescription(client.intlGet(guildId, 'commandsRoleClearDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		await client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!client.isAdministrator(interaction)) {
			const str = client.intlGet(interaction.guildId, 'missingPermission');
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str));
			log.warn(str);
			return;
		}

		let role = null;
		switch (interaction.options.getSubcommand()) {
			case 'set': {
				role = interaction.options.getRole('role');
				instance.roleId = role.id;
				client.setInstance(interaction.guildId, instance);

			} break;

			case 'clear': {
				instance.roleId = null;
				client.setInstance(interaction.guildId, instance);

			} break;

			default: {
			} break;
		}

		log.info(client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()}`
		}));

		const guild = await discordTools.getGuild(interaction.guildId);
		if (guild) {
			const category = await setupGuildCategory(guild);
			await setupGuildChannels(guild, category);
			await resetPermissionsAllChannels(guild);
		}

		if (interaction.options.getSubcommand() === 'set') {
			const str = client.intlGet(interaction.guildId, 'roleSet', { name: role.name });
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(0, str));
			log.info(str);
		}
		else {
			const str = client.intlGet(interaction.guildId, 'roleCleared');
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(0, str));
			log.info(str);
		}
	},
};
