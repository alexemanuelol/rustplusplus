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

import * as discordMessages from '../discordUtils/discordMessages';
import { DiscordManager } from '../managers/discordManager';

export default {
	name: 'help',

	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	getData(language: string) {
		return new discordjs.SlashCommandBuilder()
			.setName('help')
			.setDescription('Display help message.');
	},

	async execute(dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction): Promise<boolean> {
		await interaction.deferReply({ flags: discordjs.MessageFlags.Ephemeral });

		await discordMessages.sendHelpMessage(dm, interaction);
		return true;
	}
};