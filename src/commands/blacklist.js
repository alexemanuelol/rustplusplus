/*
	Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');
const PermissionHandler = require('../handlers/permissionHandler.js');
const Scrape = require('../util/scrape.js');

module.exports = {
	name: 'blacklist',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('blacklist')
			.setDescription(client.intlGet(guildId, 'commandsBlacklistDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(client.intlGet(guildId, 'commandsBlacklistAddDesc'))
				.addUserOption(option => option
					.setName('discord_user')
					.setDescription(client.intlGet(guildId, 'commandsBlacklistDiscordUserDesc'))
					.setRequired(false))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsBlacklistSteamidDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(client.intlGet(guildId, 'commandsBlacklistRemoveDesc'))
				.addUserOption(option => option
					.setName('discord_user')
					.setDescription(client.intlGet(guildId, 'commandsBlacklistDiscordUserDesc'))
					.setRequired(false))
				.addStringOption(option => option
					.setName('steamid')
					.setDescription(client.intlGet(guildId, 'commandsBlacklistSteamidDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('show')
				.setDescription(client.intlGet(guildId, 'commandsBlacklistShowDesc')));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;
		const instance = client.getInstance(guildId);

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;

		if (!client.isAdministrator(interaction)) {
			const str = client.intlGet(guildId, 'missingPermission');
			await client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		await interaction.deferReply({ ephemeral: true });

		const guild = DiscordTools.getGuild(guildId);

		switch (interaction.options.getSubcommand()) {
			case 'add': {
				const discordUser = interaction.options.getUser('discord_user');
				const steamid = interaction.options.getString('steamid');

				if (discordUser === null && steamid === null) {
					const str = client.intlGet(guildId, 'missingArguments');
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				let successful = 0;

				let str = '';
				if (discordUser !== null) {
					if (instance.blacklist['discordIds'].includes(discordUser.id)) {
						str += client.intlGet(guildId, 'userAlreadyInBlacklist', {
							user: `${discordUser.username} (${discordUser.id})`
						}) + ' ';
						successful = 1;
					}
					else {
						instance.blacklist['discordIds'].push(discordUser.id);
						client.setInstance(guildId, instance);

						await PermissionHandler.resetPermissionsAllChannels(client, guild);

						str += client.intlGet(guildId, 'userAddedToBlacklist', {
							user: `${discordUser.username} (${discordUser.id})`
						}) + ' ';
					}
				}

				if (steamid !== null) {
					let name = '';
					const steamName = await Scrape.scrapeSteamProfileName(client, steamid);
					if (steamName) name += `${steamName} (${steamid})`;
					else name += `${steamid}`;

					if (instance.blacklist['steamIds'].includes(steamid)) {
						str += client.intlGet(guildId, 'userAlreadyInBlacklist', {
							user: name
						}) + ' ';
						successful = 1;
					}
					else {
						instance.blacklist['steamIds'].push(steamid);
						client.setInstance(guildId, instance);
						str += client.intlGet(guildId, 'userAddedToBlacklist', {
							user: name
						}) + ' ';
					}
				}

				client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `add, ${discordUser}, ${steamid}`
				}));

				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(successful, str));
				client.log(client.intlGet(null, 'infoCap'), str);
				return;
			} break;

			case 'remove': {
				const discordUser = interaction.options.getUser('discord_user');
				const steamid = interaction.options.getString('steamid');

				if (discordUser === null && steamid === null) {
					const str = client.intlGet(guildId, 'missingArguments');
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				let successful = 0;

				let str = '';
				if (discordUser !== null) {
					if (!instance.blacklist['discordIds'].includes(discordUser.id)) {
						str += client.intlGet(guildId, 'userNotInBlacklist', {
							user: `${discordUser.username} (${discordUser.id})`
						}) + ' ';
						successful = 1;
					}
					else {
						instance.blacklist['discordIds'] =
							instance.blacklist['discordIds'].filter(e => e !== discordUser.id)
						client.setInstance(guildId, instance);

						await PermissionHandler.resetPermissionsAllChannels(client, guild);

						str += client.intlGet(guildId, 'userRemovedFromBlacklist', {
							user: `${discordUser.username} (${discordUser.id})`
						}) + ' ';
					}
				}

				if (steamid !== null) {
					let name = '';
					const steamName = await Scrape.scrapeSteamProfileName(client, steamid);
					if (steamName) name += `${steamName} (${steamid})`;
					else name += `${steamid}`;

					if (!instance.blacklist['steamIds'].includes(steamid)) {
						str += client.intlGet(guildId, 'userNotInBlacklist', {
							user: name
						}) + ' ';
						successful = 1;
					}
					else {
						instance.blacklist['steamIds'] =
							instance.blacklist['steamIds'].filter(e => e !== steamid)
						client.setInstance(guildId, instance);
						str += client.intlGet(guildId, 'userRemovedFromBlacklist', {
							user: name
						}) + ' ';
					}
				}

				client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `remove, ${discordUser}, ${steamid}`
				}));

				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(successful, str));
				client.log(client.intlGet(null, 'infoCap'), str);
				return;
			} break;

			case 'show': {
				let discordUsers = '';
				let steamIds = '';

				for (const discordId of instance.blacklist['discordIds']) {
					const user = await DiscordTools.getUserById(guildId, discordId);
					let name = '';
					if (user) name = `${user.user.username} (${user.id})`;
					else name = `${discordId}`;

					discordUsers += `${name}\n`;
				}

				for (const steamId of instance.blacklist['steamIds']) {
					let name = '';
					const steamName = await Scrape.scrapeSteamProfileName(client, steamId);
					if (steamName) name = `${steamName} (${steamId})`;
					else name = `${steamId}`;

					steamIds += `${name}\n`;
				}

				await client.interactionEditReply(interaction, {
					embeds: [DiscordEmbeds.getEmbed({
						color: Constants.COLOR_DEFAULT,
						title: client.intlGet(guildId, 'blacklist'),
						fields: [
							{
								name: client.intlGet(guildId, 'discordUsers'),
								value: discordUsers === '' ? '\u200B' : discordUsers,
								inline: true
							},
							{
								name: 'SteamId',
								value: steamIds === '' ? '\u200B' : steamIds,
								inline: true
							}]
					})],
					ephemeral: true
				});

				client.log(client.intlGet(guildId, 'infoCap'), client.intlGet(guildId, 'showingBlacklist'));
			} break;

			default: {
			} break;
		}

		return;
	},
};