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

import { log, config, localeManager as lm, credentialsManager as cm, fcmListenerManager as flm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import * as constants from '../utils/constants';
import { Credentials, VERSION } from '../managers/credentialsManager';
import { Languages } from '../managers/LocaleManager';

export default {
	name: 'credentials',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('credentials')
			.setDescription(lm.getIntl(language, 'slashCommandDescCredentials'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsAdd'))
				.addStringOption(option => option
					.setName('gcm_android_id')
					.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsAddGcmAndroidId'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('gcm_security_token')
					.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsAddGcmSecurityToken'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('steam_id')
					.setDescription(lm.getIntl(language, 'steamId'))
					.setRequired(true))
				.addNumberOption(option => option
					.setName('issued_date') // TODO! Change to issue_date
					.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsAddIssueDate'))
					.setRequired(true))
				.addNumberOption(option => option
					.setName('expire_date')
					.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsAddExpireDate'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsRemove'))
				.addStringOption(option => option
					.setName('steam_id')
					.setDescription(lm.getIntl(language, 'steamId'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('info')
				.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsInfo')))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription(lm.getIntl(language, 'slashCommandDescCredentialsList')));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fName = '[SlashCommand: credentials]';
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

			case 'info': {
				result = await executeInfo(dm, interaction);
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
	const fName = '[SlashCommand: credentials: add]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`
	const discordUserId = interaction.user.id;

	const gcmAndroidId = interaction.options.getString('gcm_android_id', true);
	const gcmSecurityToken = interaction.options.getString('gcm_security_token', true);
	const steamId = interaction.options.getString('steam_id', true);
	const issueDate = interaction.options.getNumber('issued_date', true);
	const expireDate = interaction.options.getNumber('expire_date', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	const oldCredentials = cm.getCredentials(steamId);
	const newCredentials: Credentials = {
		version: VERSION,
		steamId: steamId,
		gcm: {
			androidId: gcmAndroidId,
			securityToken: gcmSecurityToken
		},
		discordUserId: discordUserId,
		issueDate: issueDate,
		expireDate: expireDate,
		expirationNotified: false
	}

	if (oldCredentials) {
		if (oldCredentials.discordUserId !== newCredentials.discordUserId) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
				'errorDescMissingPermission');
			log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`,
				logParam);
			return false;
		}

		/* Credentials for steamId already exist, turn off fcm listener. */
		flm.stopListener(steamId);
	}

	cm.addCredentials(steamId, newCredentials);
	cm.addExpireTimeout(steamId, dm);
	flm.startListener(steamId);

	const guildNames: string[] = [];
	for (const guildId of await dm.getGuildIdsForUser(newCredentials.discordUserId)) {
		const guild = await dm.getGuild(guildId);
		if (guild) guildNames.push(`[${guild.name}](https://discord.com/channels/${guild.id})`);
	}

	const parameters = {
		steamId: steamId,
		issueDate: discordjs.time(issueDate, 'R'),
		expireDate: discordjs.time(expireDate, 'R'),
		guilds: `${guildNames.join(', ')}`
	};
	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleCredentialsAdd',
		'slashCommandSuccessDescCredentialsAdd', parameters);
	log.info(`${fName} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescCredentialsAdd',
		parameters)}`, logParam);

	return true;
}

async function executeRemove(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: credentials: remove]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`
	const discordUserId = interaction.user.id;

	const steamId = interaction.options.getString('steam_id', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`,
			logParam);
		return false;
	}

	const credentials = cm.getCredentials(steamId);
	if (!credentials) {
		const parameters = {
			steamId: `${constants.GET_STEAM_PROFILE_LINK(steamId)}`
		};
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleCredentialsForSteamIdNotFound',
			'errorDescCredentialsForSteamIdNotFound', parameters);
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language,
			'errorDescCredentialsForSteamIdNotFound', parameters)}`, logParam);
		return false
	}

	if (discordUserId !== credentials.discordUserId && !dm.isAdministrator(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`,
			logParam);
		return false;
	}

	const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
	flm.stopListener(steamId);
	cm.deleteCredentials(steamId);

	const guildNames: string[] = [];
	for (const guildId of associatedGuilds) {
		const guild = await dm.getGuild(guildId);
		if (guild) guildNames.push(`[${guild.name}](https://discord.com/channels/${guild.id})`);
	}

	const parameters = {
		steamId: `${constants.GET_STEAM_PROFILE_LINK(steamId)}`,
		guilds: `${guildNames.join(', ')}`
	};
	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleCredentialsRemove',
		'slashCommandSuccessDescCredentialsRemove', parameters);
	log.info(`${fName} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescCredentialsRemove', parameters)}`, logParam);

	return true;
}

async function executeInfo(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: credentials: info]';
	const guildId = (interaction.guild as discordjs.Guild).id;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`,
			logParam);
		return false;
	}

	await discordMessages.sendCredentialsInfoMessage(dm, interaction);
	log.info(`${fName} ${id} Successfully displaying credentials information for ` +
		`${interaction.user.username} (${interaction.user.id}).`, logParam);

	return true;
}

async function executeList(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: credentials: list]';
	const guildId = (interaction.guild as discordjs.Guild).id;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`

	if (!dm.validPermissions(interaction, true)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	await discordMessages.sendCredentialsListMessage(dm, interaction);
	log.info(`${fName} ${id} Successfully listing all credentials associated with the guild.`, logParam);

	return true;
}