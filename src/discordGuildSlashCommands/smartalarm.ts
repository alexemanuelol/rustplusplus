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
	name: 'smartalarm',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('smartalarm')
			.setDescription(lm.getIntl(language, 'slashCommandDescSmartalarm'))
			.addSubcommand(subcommand => subcommand
				.setName('edit')
				.setDescription(lm.getIntl(language, 'slashCommandDescSmartalarmEdit'))
				.addStringOption(option => option
					.setName('entity_id')
					.setDescription(lm.getIntl(language, 'slashCommandDescSmartalarmEditEntityId'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('image')
					.setDescription(lm.getIntl(language, 'slashCommandDescSmartalarmEditImage'))
					.setRequired(true)
					.addChoices(
						{ name: lm.getIntl(language, 'autoturret'), value: 'autoturret' },
						{ name: lm.getIntl(language, 'boomBox'), value: 'boombox' },
						{ name: lm.getIntl(language, 'broadcaster'), value: 'broadcaster' },
						{ name: lm.getIntl(language, 'ceilingLight'), value: 'ceiling_light' },
						{ name: lm.getIntl(language, 'discoFloor'), value: 'discofloor' },
						{ name: lm.getIntl(language, 'doorController'), value: 'door_controller' },
						{ name: lm.getIntl(language, 'elevator'), value: 'elevator' },
						{ name: lm.getIntl(language, 'hbhfSensor'), value: 'hbhf_sensor' },
						{ name: lm.getIntl(language, 'heater'), value: 'heater' },
						{ name: lm.getIntl(language, 'samsite'), value: 'samsite' },
						{ name: lm.getIntl(language, 'sirenLight'), value: 'siren_light' },
						{ name: lm.getIntl(language, 'smartAlarm'), value: 'smart_alarm' },
						{ name: lm.getIntl(language, 'smartSwitch'), value: 'smart_switch' },
						{ name: lm.getIntl(language, 'sprinkler'), value: 'sprinkler' },
						{ name: lm.getIntl(language, 'storageMonitor'), value: 'storage_monitor' },
						{ name: lm.getIntl(language, 'christmasLights'), value: 'xmas_light' })));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fName = '[SlashCommand: smartalarm]';
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
			case 'edit': {
				result = await executeEdit(dm, interaction);
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

async function executeEdit(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fName = '[SlashCommand: smartalarm: edit]';
	const guildId = interaction.guildId as types.GuildId;
	const logParam = { guildId: guildId };
	const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
	const id = `Interaction ID: ${interaction.id} -`

	const entityIdOption = interaction.options.getString('entity_id', true);
	const imageOption = interaction.options.getString('image', true);

	if (!dm.validPermissions(interaction)) {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
			'errorDescMissingPermission');
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
		return false;
	}

	const serverId = gim.getSmartDeviceServerId(guildId, rp.AppEntityType.Alarm, entityIdOption);
	if (serverId === null) {
		const parameters = {
			entityId: `\`${entityIdOption}\``
		};

		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleSmartalarmDoesNotExist',
			'errorDescSmartalarmDoesNotExist', parameters);
		log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescSmartalarmDoesNotExist', parameters)}`,
			logParam);
		return false;
	}

	const entity = gInstance.serverInfoMap[serverId].smartAlarmConfigMap[entityIdOption];
	entity.img = `${imageOption}.png`;
	gim.updateGuildInstance(guildId);

	const rpInstance = rpm.getInstance(guildId, serverId);
	if (rpInstance && gInstance.serverInfoMap[serverId].active) {
		await discordMessages.sendSmartAlarmMessage(dm, guildId, serverId, entityIdOption);
	}

	const parameters = {
		entity: `\`${entity.name} (${entityIdOption})\``
	};

	await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleSmartalarmEdit',
		'slashCommandSuccessDescSmartalarmEdit', parameters);
	log.info(`${fName} ${id} ${lm.getIntl(config.general.language,
		'slashCommandSuccessDescSmartalarmEdit', parameters)}`, logParam);

	return true;
}