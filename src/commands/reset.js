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
const Path = require('path');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
	name: 'reset',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('reset')
			.setDescription(client.intlGet(guildId, 'commandsResetDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('discord')
				.setDescription(client.intlGet(guildId, 'commandsResetDesc')));
	},

	async execute(client, interaction) {
		let instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		if (!client.isAdministrator(interaction)) {
			const str = client.intlGet(interaction.guildId, 'missingPermission');
			client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
				const guild = DiscordTools.getGuild(interaction.guildId);

				instance.firstTime = true;
				client.setInstance(interaction.guildId, instance);

				const category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				await require('../discordTools/SetupServerList')(client, guild);
				await require('../discordTools/SetupSettingsMenu')(client, guild);
				await require('../discordTools/SetupTrackers')(client, guild);

				instance = client.getInstance(interaction.guildId);
				instance.informationMessageId.map = null;
				instance.informationMessageId.server = null;
				instance.informationMessageId.event = null;
				instance.informationMessageId.team = null;
				client.setInstance(interaction.guildId, instance);

				await DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);

				const rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.isOperational) {
					await rustplus.map.writeMap(false, true);

					const channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.information);

					if (!channel) {
						client.log(client.intlGet(null, 'errorCap'),
							client.intlGet(interaction.guildId, 'invalidGuildOrChannel'), 'error');
					}
					else {
						instance = client.getInstance(guild.id);

						const file = new Discord.AttachmentBuilder(
							Path.join(__dirname, '..', `resources/images/maps/${guild.id}_map_full.png`));
						const msg = await client.messageSend(channel, { files: [file] });
						instance.informationMessageId.map = msg.id;
						client.setInstance(guild.id, instance);
					}
				}

				const str = client.intlGet(interaction.guildId, 'resetSuccess');
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			default: {
			} break;
		}
	},
};
