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

	https://github.com/alexemanuelol/rustPlusPlus

*/

const Builder = require('@discordjs/builders');
const Discord = require('discord.js');
const Path = require('path');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const PermissionHandler = require('../handlers/permissionHandler.js');

module.exports = {
	name: 'reset',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('reset')
			.setDescription(client.intlGet(guildId, 'commandsResetDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('discord')
				.setDescription(client.intlGet(guildId, 'commandsResetDesc')));
	},

	async execute(client, interaction) {
		let instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		if (!client.isAdministrator(interaction)) {
			const str = client.intlGet(interaction.guildId, 'missingPermission');
			client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
				const guild = DiscordTools.getGuild(interaction.guildId);

				instance.firstTime = true;
				client.setInstance(interaction.guildId, instance);

				const category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				await PermissionHandler.removeViewPermission(client, guild);

				await DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.switches, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.switchGroups, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.storageMonitors, 100);

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await rustplus.map.writeMap(false, true);
					await DiscordMessages.sendUpdateMapInformationMessage(rustplus);
				}

				await require('../discordTools/SetupServerList')(client, guild);
				await require('../discordTools/SetupSettingsMenu')(client, guild);

				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupSwitches')(client, rustplus);
					await require('../discordTools/SetupSwitchGroups')(client, rustplus);
					await require('../discordTools/SetupAlarms')(client, rustplus);
					await require('../discordTools/SetupStorageMonitors')(client, rustplus);
				}

				await require('../discordTools/SetupTrackers')(client, guild);

				await PermissionHandler.resetPermissions(client, guild);

				const str = client.intlGet(interaction.guildId, 'resetSuccess');
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			default: {
			} break;
		}
	},
};
