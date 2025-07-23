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
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';

import { log, config, localeManager as lm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { Languages } from '../managers/LocaleManager';

export default {
	name: 'voice',

	getData(language: Languages) {
		return new discordjs.SlashCommandBuilder()
			.setName('voice')
			.setDescription(lm.getIntl(language, 'slashCommandDescVoice'))
			.addSubcommand(subcommand => subcommand
				.setName('join')
				.setDescription(lm.getIntl(language, 'slashCommandDescVoiceJoin')))
			.addSubcommand(subcommand => subcommand
				.setName('leave')
				.setDescription(lm.getIntl(language, 'slashCommandDescVoiceLeave')));
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		const fn = '[SlashCommand: voice]';
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
			case 'join': {
				result = await executeJoin(dm, interaction);
			} break;

			case 'leave': {
				result = await executeLeave(dm, interaction);
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

async function executeJoin(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: voice: join]';
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

	const voiceState = (interaction.member as discordjs.GuildMember).voice;
	if (voiceState && voiceState.channel) {
		const voiceChannel = voiceState.channel;
		if (!voiceChannel.isVoiceBased()) {
			await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleNotInVoiceChannel',
				'errorDescNotInVoiceChannel');
			log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescNotInVoiceChannel')}`, logParam);
			return false;
		}

		joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: guildId,
			adapterCreator: (interaction.guild as discordjs.Guild).voiceAdapterCreator,
		});

		await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleVoiceJoin',
			'slashCommandSuccessDescVoiceJoin', { channel: voiceChannel.name });
		log.info(`${fn} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescVoiceJoin',
			{ channel: voiceChannel.name })}`, logParam);
	}
	else {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleNotInVoiceChannel',
			'errorDescNotInVoiceChannel');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescNotInVoiceChannel')}`, logParam);
		return false;
	}

	return true;
}

async function executeLeave(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
	const fn = '[SlashCommand: voice: leave]';
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

	const connection = getVoiceConnection(interaction.guildId as types.GuildId);
	if (connection) {
		connection.destroy();

		await discordMessages.sendDefaultMessage(dm, interaction, 'slashCommandSuccessTitleVoiceLeave',
			'slashCommandSuccessDescVoiceLeave');
		log.info(`${fn} ${id} ${lm.getIntl(config.general.language, 'slashCommandSuccessDescVoiceLeave')}`,
			logParam);
	}
	else {
		await discordMessages.sendDefaultMessage(dm, interaction, 'errorTitleVoiceNotConnected',
			'errorDescVoiceNotConnected');
		log.warn(`${fn} ${id} ${lm.getIntl(config.general.language, 'errorDescVoiceNotConnected')}`, logParam);
		return false;
	}

	return true;
}