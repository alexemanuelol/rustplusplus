/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

	https://github.com/alexemanuelol/rustPlusPlus

*/

const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

const DiscordButtons = require('../discordTools/discordButtons.js');

module.exports = {
	name: 'help',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('help')
			.setDescription(client.intlGet(guildId, 'commandsHelpDesc'));
	},

	async execute(client, interaction) {
		await client.interactionReply(interaction, {
			components: [new Discord.ActionRowBuilder()
				.addComponents(
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'DEVELOPER',
						url: 'https://github.com/alexemanuelol'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'REPOSITORY',
						url: 'https://github.com/alexemanuelol/rustPlusPlus'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'DOCUMENTATION',
						url: 'https://github.com/alexemanuelol/rustPlusPlus/blob/master/docs/documentation.md'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'CREDENTIALS',
						url: 'https://github.com/alexemanuelol/rustPlusPlus-Credential-Application/releases/v1.0.2'
					})
				)
			],
			ephemeral: true
		});
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(interaction.guildId, 'commandsHelpDesc'));
	},
};
