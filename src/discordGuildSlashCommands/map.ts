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

import { log, config, localeManager as lm, guildInstanceManager as gim, rustPlusManager as rpm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { Languages } from '../managers/LocaleManager';
import { GuildInstance } from '../managers/guildInstanceManager';
import { RustPlusMap } from '../structures/rustPlusMap';

export default {
	name: 'map',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('map')
			.setDescription(lm.getIntl(language, 'slashCommandDescMap'))
			.addStringOption(option => option
				.setName('server')
				.setDescription(lm.getIntl(language, 'slashCommandDescMapServer'))
				.setRequired(true)
				.setAutocomplete(true))
			.addBooleanOption(option => option
				.setName('complete')
				.setDescription(lm.getIntl(language, 'slashCommandDescMapComplete'))
				.setRequired(false))
			.addBooleanOption(option => option
				.setName('grids')
				.setDescription(lm.getIntl(language, 'slashCommandDescMapGrids'))
				.setRequired(false))
			.addBooleanOption(option => option
				.setName('monuments')
				.setDescription(lm.getIntl(language, 'slashCommandDescMapMonuments'))
				.setRequired(false))
			.addBooleanOption(option => option
				.setName('markers')
				.setDescription(lm.getIntl(language, 'slashCommandDescMapMarkers'))
				.setRequired(false));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fn = '[SlashCommand: map]';
		const logParam = {
			guildId: interaction.guildId
		};

		const guildId = interaction.guildId as types.GuildId;
		const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

		const id = `Interaction ID: ${interaction.id} -`
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		if (!interaction.guild) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleUnknownError',
				'errorDescUnknownError');
			log.warn(`${fn} ${id} Unknown Error: interaction.guild is not valid.`, logParam);
			return false;
		}

		const serverId = interaction.options.getString('server', true);
		const complete = interaction.options.getBoolean('complete', false) ?? false;
		const grids = interaction.options.getBoolean('grids', false) ?? complete;
		const monuments = interaction.options.getBoolean('monuments', false) ?? complete;
		const markers = interaction.options.getBoolean('markers', false) ?? complete;

		if (!Object.keys(gInstance.serverInfoMap).includes(serverId)) {
			const parameters = {
				server: `\`${serverId}\``
			};

			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMapServerNotFound',
				'errorDescMapServerNotFound', parameters);
			log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMapServerNotFound', parameters)}`,
				logParam);
			return false;
		}

		const rpInstance = rpm.getInstance(guildId, serverId);
		if (!rpInstance || (rpInstance !== null && (!rpInstance.rpMap || !rpInstance.rpInfo))) {
			const parameters = {
				server: `\`${gInstance.serverInfoMap[serverId].name}\``
			};

			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleMapNotConnected',
				'errorDescMapServerNotConnected', parameters);
			log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescMapServerNotConnected', parameters)}`,
				logParam);
			return false;
		}

		const imageName = await (rpInstance.rpMap as RustPlusMap).writeImage(grids, monuments, markers);
		await discordMessages.sendMapMessage(dm, interaction, serverId, imageName);
		log.info(`${fn} ${id} Showing the map.`, logParam);

		return true;
	}
};