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

const Config = require('../../config');
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
				.setDescription(client.intlGet(guildId, 'commandsResetDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('information')
				.setDescription(client.intlGet(guildId, 'commandsResetInformationDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('servers')
				.setDescription(client.intlGet(guildId, 'commandsResetServersDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('settings')
				.setDescription(client.intlGet(guildId, 'commandsResetSettingsDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('switches')
				.setDescription(client.intlGet(guildId, 'commandsResetSwitchesDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('alarms')
				.setDescription(client.intlGet(guildId, 'commandsResetAlarmsDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('storagemonitors')
				.setDescription(client.intlGet(guildId, 'commandsResetStorageMonitorsDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('trackers')
				.setDescription(client.intlGet(guildId, 'commandsResetTrackersDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
			const str = client.intlGet(interaction.guildId, 'missingPermission');
			client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}
		await interaction.deferReply({ ephemeral: true });

		const guild = DiscordTools.getGuild(interaction.guildId);

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
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
				await require('../discordTools/SetupSettingsMenu')(client, guild, true);

				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupSwitches')(client, rustplus);
					await require('../discordTools/SetupSwitchGroups')(client, rustplus);
					await require('../discordTools/SetupAlarms')(client, rustplus);
					await require('../discordTools/SetupStorageMonitors')(client, rustplus);
				}

				await require('../discordTools/SetupTrackers')(client, guild);

				await PermissionHandler.resetPermissions(client, guild);
			} break;

			case 'information': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await rustplus.map.writeMap(false, true);
					await DiscordMessages.sendUpdateMapInformationMessage(rustplus);
				}
			} break;

			case 'servers': {
				await PermissionHandler.removeViewPermission(client, guild);
				await require('../discordTools/SetupServerList')(client, guild);
				await PermissionHandler.resetPermissions(client, guild);
			} break;

			case 'settings': {
				await PermissionHandler.removeViewPermission(client, guild);
				await require('../discordTools/SetupSettingsMenu')(client, guild, true);
				await PermissionHandler.resetPermissions(client, guild);
			} break;

			case 'switches': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.switches, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.switchGroups, 100);

				await PermissionHandler.removeViewPermission(client, guild);
				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupSwitches')(client, rustplus);
					await require('../discordTools/SetupSwitchGroups')(client, rustplus);
				}
				await PermissionHandler.resetPermissions(client, guild);
			} break;

			case 'alarms': {
				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupAlarms')(client, rustplus);
				}
			} break;

			case 'storagemonitors': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelId.storageMonitors, 100);

				await PermissionHandler.removeViewPermission(client, guild);
				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupStorageMonitors')(client, rustplus);
				}
				await PermissionHandler.resetPermissions(client, guild);
			} break;

			case 'trackers': {
				await PermissionHandler.removeViewPermission(client, guild);
				await require('../discordTools/SetupTrackers')(client, guild);
				await PermissionHandler.resetPermissions(client, guild);
			} break;

			default: {
			} break;
		}

		const str = client.intlGet(interaction.guildId, 'resetSuccess');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		client.log(client.intlGet(null, 'infoCap'), str);
	},
};
