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

export default {
	name: 'alias',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('alias')
			.setDescription(lm.getIntl(language, 'slashCommandDescAlias'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(lm.getIntl(language, 'slashCommandDescAliasAdd'))
				.addStringOption(option => option
					.setName('alias')
					.setDescription(lm.getIntl(language, 'slashCommandDescAliasAddAlias'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('value')
					.setDescription(lm.getIntl(language, 'slashCommandDescAliasAddValue'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(lm.getIntl(language, 'slashCommandDescAliasRemove'))
				.addStringOption(option => option
					.setName('alias')
					.setDescription(lm.getIntl(language, 'slashCommandDescAliasRemoveAlias'))
					.setRequired(true)
					.setAutocomplete(true)))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription(lm.getIntl(language, 'slashCommandDescAliasList')));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fn = '[SlashCommand: alias]';
		const logParam = {
			guildId: interaction.guildId
		};

		const id = `Interaction ID: ${interaction.id} -`
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		if (!interaction.guild) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
				'errorDescUnknownError');
			log.warn(`${fn} ${id} Unknown Error: interaction.guild is not valid.`, logParam);
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
				log.info(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescInvalidSubcommand')}`,
					logParam);
				result = false;
			} break;
		}

		return result;
	}
};

async function executeAdd(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: alias: add]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = {
		guildId: guildId
	};

	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const id = `Interaction ID: ${interaction.id} -`

	const aliasOption = interaction.options.getString('alias', true);
	const valueOption = interaction.options.getString('value', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	for (const alias of gInstance.aliases) {
		if (alias.alias === aliasOption) {
			const parameters = {
				alias: `\`${alias.alias}\``,
				value: `\`${alias.value}\``
			};

			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleAliasAlreadyExist',
				'errorDescAliasAlreadyExist', parameters);
			log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescAliasAlreadyExist', parameters)}`,
				logParam);
			return false;
		}
	}

	gInstance.aliases.push({ alias: aliasOption, value: valueOption });
	gim.updateGuildInstance(guildId);

	const parameters = {
		alias: `\`${aliasOption}\``,
		value: `\`${valueOption}\``
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleAliasAdd',
		'slashCommandSuccessDescAliasAdd', parameters);
	log.info(`${fn} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescAliasAdd', parameters)}`, logParam);

	return true;
}

async function executeRemove(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: alias: remove]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = {
		guildId: guildId
	};

	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const id = `Interaction ID: ${interaction.id} -`

	const aliasOption = interaction.options.getString('alias', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	if (!gInstance.aliases.some(e => e.alias === aliasOption)) {
		const parameters = {
			alias: `\`${aliasOption}\``,
		};

		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleAliasNotFound',
			'errorDescAliasNotFound', parameters);
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescAliasNotFound', parameters)}`,
			logParam);
		return false;
	}

	gInstance.aliases = gInstance.aliases.filter(e => e.alias !== aliasOption);
	gim.updateGuildInstance(guildId);

	const parameters = {
		alias: `\`${aliasOption}\``,
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleAliasRemove',
		'slashCommandSuccessDescAliasRemove', parameters);
	log.info(`${fn} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescAliasRemove', parameters)}`, logParam);

	return true;
}

async function executeList(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: alias: list]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = {
		guildId: guildId
	};

	const id = `Interaction ID: ${interaction.id} -`

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	await discordMessages.sendAliasListMessage(dm, interaction);
	log.info(`${fn} ${id} Successfully listing aliases.`, logParam);

	return true;
}
