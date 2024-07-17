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
import { removeGuildChannels } from '../discordTools/remove-guild-channels';
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

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;

		if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
			const str = client.intlGet(interaction.guildId, 'missingPermission');
			client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			log.warn(str);
			return;
		}
		await interaction.deferReply({ ephemeral: true });

		const guild = DiscordTools.getGuild(interaction.guildId);

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
				await removeGuildChannels(client, guild);

				const category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.information, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.switches, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.switchGroups, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.storageMonitors, 100);

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

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `discord`
				}));
			} break;

			case 'information': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.information, 100);

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await rustplus.map.writeMap(false, true);
					await DiscordMessages.sendUpdateMapInformationMessage(rustplus);
				}

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `information`
				}));
			} break;

			case 'servers': {
				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					const category = await DiscordTools.getCategoryById(guild.id, instance.channelIds.category);
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				await require('../discordTools/SetupServerList')(client, guild);

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `servers`
				}));
			} break;

			case 'settings': {
				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					const category = await DiscordTools.getCategoryById(guild.id, instance.channelIds.category);
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				await require('../discordTools/SetupSettingsMenu')(client, guild, true);

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `settings`
				}));
			} break;

			case 'switches': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.switches, 100);
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.switchGroups, 100);

				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					const category = await DiscordTools.getCategoryById(guild.id, instance.channelIds.category);
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupSwitches')(client, rustplus);
					await require('../discordTools/SetupSwitchGroups')(client, rustplus);
				}

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `switches`
				}));
			} break;

			case 'alarms': {
				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupAlarms')(client, rustplus);
				}

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `alarms`
				}));
			} break;

			case 'storagemonitors': {
				await DiscordTools.clearTextChannel(guild.id, instance.channelIds.storageMonitors, 100);

				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					const category = await DiscordTools.getCategoryById(guild.id, instance.channelIds.category);
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await require('../discordTools/SetupStorageMonitors')(client, rustplus);
				}

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `storagemonitors`
				}));
			} break;

			case 'trackers': {
				const perms = PermissionHandler.getPermissionsRemoved(client, guild);
				try {
					const category = await DiscordTools.getCategoryById(guild.id, instance.channelIds.category);
					await category.permissionOverwrites.set(perms);
				}
				catch (e) {
					/* Ignore */
				}

				await require('../discordTools/SetupTrackers')(client, guild);

				await PermissionHandler.resetPermissionsAllChannels(client, guild);

				log.info(client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `trackers`
				}));
			} break;

			default: {
			} break;
		}

		const str = client.intlGet(interaction.guildId, 'resetSuccess');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		log.info(str);
	},
};
