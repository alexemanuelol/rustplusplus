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
import * as rp from 'rustplus-ts';

import { log, config, localeManager as lm, guildInstanceManager as gim, rustPlusManager as rpm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { Languages } from '../managers/LocaleManager';
import { GuildInstance } from '../managers/guildInstanceManager';

export default {
	name: 'storagemonitor',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('storagemonitor')
			.setDescription(lm.getIntl(language, 'slashCommandDescStoragemonitor'))
			.addSubcommand(subcommand => subcommand
				.setName('edit')
				.setDescription(lm.getIntl(language, 'slashCommandDescStoragemonitorEdit'))
				.addStringOption(option => option
					.setName('entity_id')
					.setDescription(lm.getIntl(language, 'slashCommandDescStoragemonitorEditEntityId'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('image')
					.setDescription(lm.getIntl(language, 'slashCommandDescStoragemonitorEditImage'))
					.setRequired(true)
					.addChoices(
						{ name: lm.getIntl(language, 'storageMonitor'), value: 'storage_monitor' },
						{ name: lm.getIntl(language, 'toolCupboard'), value: 'tool_cupboard' },
						{ name: lm.getIntl(language, 'largeWoodBox'), value: 'large_wood_box' },
						{ name: lm.getIntl(language, 'vendingMachine'), value: 'vending_machine' })));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fn = '[SlashCommand: storagemonitor]';
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
			case 'edit': {
				result = await executeEdit(dm, interaction);
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

async function executeEdit(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: storagemonitor: edit]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = {
		guildId: guildId
	};

	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const id = `Interaction ID: ${interaction.id} -`

	const entityIdOption = interaction.options.getString('entity_id', true);
	const imageOption = interaction.options.getString('image', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	const serverId = gim.getSmartDeviceServerId(guildId, rp.AppEntityType.StorageMonitor, entityIdOption);
	if (serverId === null) {
		const parameters = {
			entityId: `\`${entityIdOption}\``
		};

		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleStoragemonitorDoesNotExist',
			'errorDescStoragemonitorDoesNotExist', parameters);
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescStoragemonitorDoesNotExist',
			parameters)}`, logParam);
		return false;
	}

	const entity = gInstance.serverInfoMap[serverId].storageMonitorConfigMap[entityIdOption];
	entity.img = `${imageOption}.png`;
	gim.updateGuildInstance(guildId);

	const rpInstance = rpm.getInstance(guildId, serverId);
	if (rpInstance && gInstance.serverInfoMap[serverId].active) {
		await discordMessages.sendStorageMonitorMessage(dm, guildId, serverId, entityIdOption);
	}

	const parameters = {
		entity: `\`${entity.name} (${entityIdOption})\``
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleStoragemonitorEdit',
		'slashCommandSuccessDescStoragemonitorEdit', parameters);
	log.info(`${fn} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescStoragemonitorEdit',
		parameters)}`, logParam);

	return true;
}