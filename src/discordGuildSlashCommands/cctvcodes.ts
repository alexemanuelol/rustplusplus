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

import { log, config, localeManager as lm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import { Languages } from '../managers/LocaleManager';

export default {
	name: 'cctvcodes',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('cctvcodes')
			.setDescription(lm.getIntl(language, 'slashCommandDescCctvcodes'))
			.addStringOption(option => option
				.setName('monument')
				.setDescription(lm.getIntl(language, 'slashCommandDescCctvcodesMonument'))
				.setRequired(true)
				.addChoices(
					{
						name: lm.getIntl(language, 'all'),
						value: 'all'
					},
					{
						name: lm.getIntl(language, 'monumentName-AbandonedMilitaryBase'),
						value: 'AbandonedMilitaryBase'
					},
					{
						name: lm.getIntl(language, 'monumentName-airfield_display_name'),
						value: 'airfield_display_name'
					},
					{
						name: lm.getIntl(language, 'monumentName-bandit_camp'),
						value: 'bandit_camp'
					},
					{
						name: lm.getIntl(language, 'monumentName-dome_monument_name'),
						value: 'dome_monument_name'
					},
					{
						name: lm.getIntl(language, 'monumentName-ferryterminal'),
						value: 'ferryterminal'
					},
					{
						name: lm.getIntl(language, 'monumentName-large_oil_rig'),
						value: 'large_oil_rig'
					},
					{
						name: lm.getIntl(language, 'monumentName-missile_silo_monument'),
						value: 'missile_silo_monument'
					},
					{
						name: lm.getIntl(language, 'monumentName-outpost'),
						value: 'outpost'
					},
					{
						name: lm.getIntl(language, 'monumentName-radtown'),
						value: 'radtown'
					},
					{
						name: lm.getIntl(language, 'monumentName-oil_rig_small'),
						value: 'oil_rig_small'
					},
					{
						name: lm.getIntl(language, 'monumentName-underwater_lab'),
						value: 'underwater_lab'
					}));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fName = '[SlashCommand: cctvcodes]';
		const logParam = { guildId: interaction.guildId };

		const id = `Interaction ID: ${interaction.id} -`
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		if (!interaction.guild) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
				'errorDescUnknownError');
			log.warn(`${fName} ${id} Unknown Error: interaction.guild is not valid.`, logParam);
			return false;
		}

		const monumentOption = interaction.options.getString('monument', true);

		if (!dm.validPermissions(interaction)) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMissingPermission',
				'errorDescMissingPermission');
			log.warn(`${fName} ${id} ${lm.getIntl(config.general.language, 'errorDescMissingPermission')}`, logParam);
			return false;
		}

		await discordMessages.sendCctvcodesMessage(dm, interaction, monumentOption);

		return true;
	}
};