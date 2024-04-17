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

	https://github.com/alexemanuelol/rustplusplus

*/

const Builder = require('@discordjs/builders');
const Discord = require('discord.js');
const Path = require('path');

const Constants = require('../../dist/util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'map',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('map')
			.setDescription(client.intlGet(guildId, 'commandsMapDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('all')
				.setDescription(client.intlGet(guildId, 'commandsMapAllDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('clean')
				.setDescription(client.intlGet(guildId, 'commandsMapCleanDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('monuments')
				.setDescription(client.intlGet(guildId, 'commandsMapMonumentsDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('markers')
				.setDescription(client.intlGet(guildId, 'commandsMapMarkersDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'all': {
				await rustplus.map.writeMap(true, true);
			} break;

			case 'clean': {
				/* Do nothing */
			} break;

			case 'monuments': {
				await rustplus.map.writeMap(false, true);
			} break;

			case 'markers': {
				await rustplus.map.writeMap(true, false);
			} break;

			default: {
			} break;
		}

		let file = null;
		if (interaction.options.getSubcommand() === 'clean') {
			file = new Discord.AttachmentBuilder(
				Path.join(__dirname, '..', '..', `maps/${interaction.guildId}_map_clean.png`));
		}
		else {
			file = new Discord.AttachmentBuilder(
				Path.join(__dirname, '..', '..', `maps/${interaction.guildId}_map_full.png`));
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()}`
		}));

		const fileName = (interaction.options.getSubcommand() === 'clean') ? 'clean' : 'full';
		await client.interactionEditReply(interaction, {
			embeds: [DiscordEmbeds.getEmbed({
				color: Constants.COLOR_DEFAULT,
				image: `attachment://${interaction.guildId}_map_${fileName}.png`,
				footer: { text: instance.serverList[rustplus.serverId].title }
			})],
			files: [file],
			ephemeral: true
		});
		rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), client.intlGet(interaction.guildId,
			'displayingMap', { mapName: fileName }));
	},
};