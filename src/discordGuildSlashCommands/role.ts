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

export default {
	name: 'role',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('role')
			.setDescription(lm.getIntl(language, 'slashCommandDescRole'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(lm.getIntl(language, 'slashCommandDescRoleAdd'))
				.addStringOption(option => option
					.setName('type')
					.setDescription(lm.getIntl(language, 'slashCommandDescRoleAddType'))
					.setRequired(true)
					.addChoices(
						{ name: lm.getIntl(language, 'roles'), value: 'roleIds' },
						{ name: lm.getIntl(language, 'admins'), value: 'adminIds' }))
				.addStringOption(option => option
					.setName('role')
					.setDescription(lm.getIntl(language, 'slashCommandDescRoleAddRole'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(lm.getIntl(language, 'slashCommandDescRoleRemove'))
				.addStringOption(option => option
					.setName('type')
					.setDescription(lm.getIntl(language, 'slashCommandDescRoleRemoveType'))
					.setRequired(true)
					.addChoices(
						{ name: lm.getIntl(language, 'roles'), value: 'roleIds' },
						{ name: lm.getIntl(language, 'admins'), value: 'adminIds' }))
				.addStringOption(option => option
					.setName('role')
					.setDescription(lm.getIntl(language, 'slashCommandDescRoleRemoveRole'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription(lm.getIntl(language, 'slashCommandDescRoleList')));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const funcName = '[SlashCommand: role]';
		const logParam = { guildId: interaction.guildId };

		const id = `Interaction ID: ${interaction.id} -`
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		if (!interaction.guild) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
				'errorDescUnknownError');
			log.warn(`${funcName} ${id} Unknown Error: interaction.guild is not valid.`, logParam);
			return false;
		}

		if (!dm.validPermissions(interaction, true)) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
				'errorDescMissingPermission');
			log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`,
				logParam);
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
				log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescInvalidSubcommand')}`,
					logParam);
				result = false;
			} break;
		}

		return result;
	}
};

async function executeAdd(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const funcName = '[SlashCommand: role: add]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`
	const type = interaction.options.getString('type', true) as 'roleIds' | 'adminIds';
	const roleId = interaction.options.getString('role', true);

	const gInstance = gim.getGuildInstance(guildId);
	if (!gInstance) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: Could not get GuildInstance.`, logParam);
		return false;
	}

	if (!(type in gInstance)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: GuildInstance does not have '${type}'.`, logParam);
		return false;
	}

	if (!interaction.guild!.roles.cache.get(roleId)) {
		const parameters = {
			role: roleId
		};
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleRoleDoesNotExist',
			'errorDescRoleDoesNotExist', parameters);
		log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescRoleDoesNotExist', parameters)}`,
			logParam);
		return false;
	}

	if (gInstance[type].includes(roleId)) {
		const parameters = {
			role: `<@&${roleId}>`
		};
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleRoleAlreadyConfigured',
			'errorDescRoleAlreadyConfigured', parameters);
		log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescRoleAlreadyConfigured',
			parameters)}`, logParam);
		return false;
	}

	gInstance[type].push(roleId);
	gim.updateGuildInstance(guildId);

	/* Used to update permissions. */
	await dm.setupGuild(interaction.guild as discordjs.Guild);

	const parameters = {
		role: `<@&${roleId}>`
	};
	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleRoleAdd',
		'slashCommandSuccessDescRoleAdd', parameters);
	log.info(`${funcName} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescRoleAdd', parameters)}`,
		logParam);

	return true;
}

async function executeRemove(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const funcName = '[SlashCommand: role: remove]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`
	const type = interaction.options.getString('type', true) as 'roleIds' | 'adminIds';
	const roleId = interaction.options.getString('role', true);

	const gInstance = gim.getGuildInstance(guildId);
	if (!gInstance) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: Could not get GuildInstance.`, logParam);
		return false;
	}

	if (!(type in gInstance)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: GuildInstance does not have '${type}'.`, logParam);
		return false;
	}

	if (!interaction.guild!.roles.cache.get(roleId)) {
		const parameters = {
			role: roleId
		};
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleRoleDoesNotExist',
			'errorDescRoleDoesNotExist', parameters);
		log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescRoleDoesNotExist', parameters)}`,
			logParam);
		return false;
	}

	if (!gInstance[type].includes(roleId)) {
		const parameters = {
			role: `<@&${roleId}>`
		};
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleRoleNotConfigured',
			'errorDescRoleNotConfigured', parameters);
		log.warn(`${funcName} ${id} ${lm.getIntl(config.general.language, 'errorDescRoleNotConfigured', parameters)}`,
			logParam);
		return false;
	}

	gInstance[type] = gInstance[type].filter(gInstanceRoleId => gInstanceRoleId !== roleId);
	gim.updateGuildInstance(guildId);

	/* Used to update permissions. */
	await dm.setupGuild(interaction.guild as discordjs.Guild);

	const parameters = {
		role: `<@&${roleId}>`
	};
	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleRoleRemove',
		'slashCommandSuccessDescRoleRemove', parameters);
	log.info(`${funcName} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescRoleRemove',
		parameters)}`, logParam);

	return true;
}

async function executeList(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const funcName = '[SlashCommand: role: list]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };

	const id = `Interaction ID: ${interaction.id} -`

	const gInstance = gim.getGuildInstanceDeepCopy(guildId);
	if (!gInstance) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: Could not get GuildInstance.`, logParam);
		return false;
	}

	if (!('adminIds' in gInstance) || !('roleIds' in gInstance)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
			'errorDescUnknownError');
		log.warn(`${funcName} ${id} Unknown Error: GuildInstance does not have adminIds or roleIds.`, logParam);
		return false;
	}

	await discordMessages.sendRoleListMessage(dm, interaction);
	log.info(`${funcName} ${id} Successfully listing all configured roles.`, logParam);

	return true;
}