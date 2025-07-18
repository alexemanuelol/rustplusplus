/*
	Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';

import { log, config, localeManager as lm, guildInstanceManager as gim } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { Languages } from '../managers/LocaleManager';
import { GuildInstance } from '../managers/guildInstanceManager';
import { fetchSteamProfileName } from '../utils/steam';

export default {
	name: 'blacklist',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('blacklist')
			.setDescription(lm.getIntl(language, 'slashCommandDescBlacklist'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistAdd'))
				.addUserOption(option => option
					.setName('discord_user')
					.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistAddDiscordUser'))
					.setRequired(false))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistAddSteamid'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistRemove'))
				.addStringOption(option => option
					.setName('discord_user')
					.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistRemoveDiscordUser'))
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistRemoveSteamid'))
					.setRequired(false)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription(lm.getIntl(language, 'slashCommandDescBlacklistList')));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fName = '[SlashCommand: blacklist]';
		const logParam = { guildId: interaction.guildId };

		const id = `Interaction ID: ${interaction.id} -`
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		if (!interaction.guild) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
				'errorDescUnknownError');
			log.warn(`${fName} ${id} Unknown Error: interaction.guild is not valid.`, logParam);
			return false;
		}

		let result = false;
		switch (interaction.options.getSubcommand()) {
			case 'add': {
				result = await executeAdd(dm, interaction);
			} break;

			case 'remove': {
				result = await executeRemove(dm, interaction);
			} break;

			case 'list': {
				result = await executeList(dm, interaction);
			} break;

			default: {
				const parameters = {
					subcommand: interaction.options.getSubcommand()
				}
				await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleInvalidSubcommand',
					'errorDescInvalidSubcommand', parameters);
				log.info(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescInvalidSubcommand')}`,
					logParam);
				result = false;
			} break;
		}

		return result;
	}
};

async function executeAdd(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: blacklist: add]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };
	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const language = gInstance.generalSettings.language;
	const id = `Interaction ID: ${interaction.id} -`

	const discordUserOption = interaction.options.getUser('discord_user', false);
	const steamidOption = interaction.options.getString('steamid', false);

	if (!dm.isAdministrator(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	if (discordUserOption === null && steamidOption === null) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleBlacklistMissingArguments',
			'errorDescBlacklistMissingArguments');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescBlacklistMissingArguments')}`,
			logParam);
		return false;
	}

	const discordUserExist = discordUserOption !== null &&
		gInstance.blacklist.userIds.includes(discordUserOption.id);
	const steamidExist = steamidOption !== null &&
		gInstance.blacklist.steamIds.includes(steamidOption);

	let steamName: string | null = lm.getIntl(language, 'unknown');
	if (steamidOption !== null) {
		steamName = await fetchSteamProfileName(steamidOption);
	}

	if (discordUserExist || steamidExist) {
		const parameters = {
			user: discordUserExist ? `\`${discordUserOption.displayName}\` (${discordUserOption.id})` :
				`\`${steamidOption}\` (${steamName})`
		};

		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleBlacklistUserAlreadyExist',
			'errorDescBlacklistUserAlreadyExist', parameters);
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescBlacklistUserAlreadyExist',
			parameters)}`, logParam);
		return false;
	}

	let user = '';
	if (discordUserOption !== null) {
		gInstance.blacklist.userIds.push(discordUserOption.id);
		gim.updateGuildInstance(guildId);
		user = `\`${discordUserOption.displayName}\` (${discordUserOption.id})`;

		/* Used to update permissions */
		dm.setupGuild(interaction.guild as discordjs.Guild, true);
	}
	else if (steamidOption !== null) {
		gInstance.blacklist.steamIds.push(steamidOption);
		gim.updateGuildInstance(guildId);
		user = `\`${steamidOption}\` (${steamName})`;
	}

	const parameters = {
		user: user,
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleBlacklistAdd',
		'slashCommandSuccessDescBlacklistAdd', parameters);
	log.info(`${fName} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescBlacklistAdd', parameters)}`, logParam);

	return true;
}

async function executeRemove(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: blacklist: remove]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };
	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const language = gInstance.generalSettings.language;
	const id = `Interaction ID: ${interaction.id} -`

	const discordUserOption = interaction.options.getString('discord_user', false);
	const steamidOption = interaction.options.getString('steamid', false);

	if (!dm.isAdministrator(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	if (discordUserOption === null && steamidOption === null) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleBlacklistMissingArguments',
			'errorDescBlacklistMissingArguments');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescBlacklistMissingArguments')}`,
			logParam);
		return false;
	}

	const discordUserDoesNotExist = discordUserOption !== null &&
		!gInstance.blacklist.userIds.includes(discordUserOption);
	const steamidDoesNotExist = steamidOption !== null &&
		!gInstance.blacklist.steamIds.includes(steamidOption);

	let steamName: string | null = lm.getIntl(language, 'unknown');
	if (steamidOption !== null) {
		steamName = await fetchSteamProfileName(steamidOption);
	}

	let userName = '';
	if (discordUserOption !== null) {
		const member = await dm.getMember(guildId, discordUserOption);
		userName = member ? member.displayName : lm.getIntl(language, 'unknown');
	}

	if (discordUserDoesNotExist || steamidDoesNotExist) {
		const parameters = {
			user: discordUserDoesNotExist ? `\`${userName}\` (${discordUserOption})` :
				`\`${steamidOption}\` (${steamName})`
		};

		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleBlacklistUserDoesNotExist',
			'errorDescBlacklistUserDoesNotExist', parameters);
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescBlacklistUserDoesNotExist',
			parameters)}`, logParam);
		return false;
	}

	let user = '';
	if (discordUserOption !== null) {
		gInstance.blacklist.userIds = gInstance.blacklist.userIds.filter(e => e !== discordUserOption);
		gim.updateGuildInstance(guildId);
		user = `\`${userName}\` (${discordUserOption})`;

		/* Used to update permissions */
		dm.setupGuild(interaction.guild as discordjs.Guild, true);
	}
	else if (steamidOption !== null) {
		gInstance.blacklist.steamIds = gInstance.blacklist.steamIds.filter(e => e !== steamidOption);
		gim.updateGuildInstance(guildId);
		user = `\`${steamidOption}\` (${steamName})`;
	}

	const parameters = {
		user: user,
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleBlacklistRemove',
		'slashCommandSuccessDescBlacklistRemove', parameters);
	log.info(`${fName} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescBlacklistRemove', parameters)}`, logParam);

	return true;
}

async function executeList(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: blacklist: list]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };
	const id = `Interaction ID: ${interaction.id} -`

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	await discordMessages.sendBlacklistListMessage(dm, interaction);
	log.info(`${fName} ${id} Successfully listing the blacklist.`, logParam);

	return true;
}
