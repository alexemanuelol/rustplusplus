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

module.exports = {
	name: 'players',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('players')
			.setDescription(client.intlGet(guildId, 'commandsPlayersDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('name')
				.setDescription(client.intlGet(guildId, 'commandsPlayersNameDesc'))
				.addStringOption(option => option
					.setName('status')
					.setDescription(client.intlGet(guildId, 'commandsPlayersStatusDesc'))
					.setRequired(true)
					.addChoices(
						{ name: client.intlGet(guildId, 'online'), value: '0' },
						{ name: client.intlGet(guildId, 'offline'), value: '1' },
						{ name: client.intlGet(guildId, 'any'), value: '2' }))
				.addStringOption(option => option
					.setName('name')
					.setDescription(client.intlGet(guildId, 'theNameOfThePlayer'))
					.setRequired(false))
				.addStringOption(option => option
					.setName('battlemetricsid')
					.setDescription(client.intlGet(guildId, 'commandsPlayersBattlemetricsIdDesc'))
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('playerid')
				.setDescription(client.intlGet(guildId, 'commandsPlayersPlayerIdDesc'))
				.addStringOption(option => option
					.setName('playerid')
					.setDescription(client.intlGet(guildId, 'commandsPlayersPlayerIdPlayerIdDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('battlemetricsid')
					.setDescription(client.intlGet(guildId, 'commandsPlayersBattlemetricsIdDesc'))
					.setRequired(false)));
	},

	async execute(client, interaction) {
		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		let battlemetricsId = interaction.options.getString('battlemetricsid');

		if (!battlemetricsId) {
			const rustplus = client.rustplusInstances[interaction.guildId];
			if (!rustplus || (rustplus && !rustplus.isOperational)) {
				const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(null, 'warningCap'), str);
				return;
			}

			const instance = client.getInstance(interaction.guildId);
			const server = instance.serverList[rustplus.serverId];
			if (!server || (server && !server.battlemetricsId)) {
				const str = client.intlGet(interaction.guildId, 'invalidBattlemetricsId');
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
				client.log(client.intlGet(null, 'warningCap'), str);
				return;
			}

			battlemetricsId = server.battlemetricsId;
		}

		const bmInstance = client.battlemetricsInstances[battlemetricsId];
		if (!bmInstance || !bmInstance.lastUpdateSuccessful) {
			const str = client.intlGet(interaction.guildId, 'battlemetricsInstanceCouldNotBeFound', {
				id: battlemetricsId
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'name': {
				await playersNameHandler(client, interaction, battlemetricsId);
			} break;

			case 'playerid': {
				await playersPlayerIdHandler(client, interaction, battlemetricsId);
			} break;

			default: {
			} break;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()} ` +
				`${interaction.options.getString('name')} ` +
				`${interaction.options.getString('playerid')} ` +
				`${interaction.options.getString('status')} ` +
				`${interaction.options.getString('battlemetricsid')} `
		}));
	},
};

async function playersNameHandler(client, interaction, battlemetricsId) {
	const bmInstance = client.battlemetricsInstances[battlemetricsId];

	const status = interaction.options.getString('status');
	const name = interaction.options.getString('name');

	let players = [];
	if (status === '0' || status === '2') { /* Online or any */
		players = players.concat(bmInstance.getOnlinePlayerIdsOrderedByTime());
	}
	if (status === '1' || status === '2') { /* Offline or any */
		players = players.concat(bmInstance.getOfflinePlayerIdsOrderedByLeastTimeSinceOnline());
	}

	let foundPlayers = [];
	if (name !== null) {
		for (const playerId of players) {
			if (bmInstance.players[playerId]['name'].includes(name)) foundPlayers.push(playerId);
		}
	}
	else {
		foundPlayers = players;
	}

	if (foundPlayers.length === 0) {
		const str = client.intlGet(interaction.guildId, 'couldNotFindAnyPlayers');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		client.log(client.intlGet(null, 'warningCap'), str);
		return;
	}
	else if (foundPlayers.length === 1) {
		await displaySpecificUser(client, interaction, battlemetricsId, foundPlayers[0]);
	}
	else {
		await displaySeveralUsers(client, interaction, battlemetricsId, foundPlayers, name);
	}
}

async function playersPlayerIdHandler(client, interaction, battlemetricsId) {
	const bmInstance = client.battlemetricsInstances[battlemetricsId];

	const playerId = interaction.options.getString('playerid');

	if (!bmInstance.players.hasOwnProperty(playerId)) {
		const str = client.intlGet(interaction.guildId, 'couldNotFindPlayerId', { id: playerId });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		client.log(client.intlGet(null, 'warningCap'), str);
		return;
	}

	await displaySpecificUser(client, interaction, battlemetricsId, playerId);

}

async function displaySpecificUser(client, interaction, battlemetricsId, playerId) {
	const guildId = interaction.guildId;
	const bmInstance = client.battlemetricsInstances[battlemetricsId];

	const userName = bmInstance.players[playerId]['name'];

	const profileNames = [];
	const data = await bmInstance.getProfileData(playerId);

	for (const name of bmInstance.players[playerId]['nameChangeHistory']) {
		if (!profileNames.some(e => e['name'] === name['from'])) {
			profileNames.push({ name: name['from'], lastSeen: name['time'] });
		}
	}

	for (const name of data) {
		if (!profileNames.some(e => e['name'] === name['name'])) {
			profileNames.push({ name: name['name'], lastSeen: name['lastSeen'] });
		}
	}

	if (!profileNames.some(e => e['name'] === userName)) {
		profileNames.unshift({ name: userName, lastSeen: null });
	}

	const profileLink = `[${playerId}](${Constants.BATTLEMETRICS_PROFILE_URL}${playerId})`;
	const battlemetricsLink = `[${bmInstance.id}](${Constants.BATTLEMETRICS_SERVER_URL}${bmInstance.id})`;
	const isOnline = bmInstance.players[playerId]['status'];
	const status = isOnline ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;
	const onOffString = isOnline ? client.intlGet(guildId, 'onlineTime') :
		client.intlGet(guildId, 'offlineTime');
	const time = isOnline ? bmInstance.getOnlineTime(playerId) : bmInstance.getOfflineTime(playerId);

	let description = `__**${client.intlGet(guildId, 'profile')}:**__ ${profileLink}\n`;
	description += `__**Battlemetrics ID:**__ ${battlemetricsLink}\n`;
	description += `__**${client.intlGet(guildId, 'status')}:**__ ${status}\n`;
	description += `__**${onOffString}:**__ ${time !== null ? `[${time[1]}]` : ''}\n`;

	const embed = DiscordEmbeds.getEmbed({
		title: `${client.intlGet(interaction.guildId, 'playersSearch')}: ${userName}`,
		color: Constants.COLOR_DEFAULT,
		description: description,
		footer: { text: bmInstance.server_name }
	});

	let nameChangeHistoryName = '', nameChangeHistoryTime = '';
	let connectionString = '', connectionTime = '';

	let nameChangeHistoryNameCharacters = 0, nameChangeHistoryTimeCharacters = 0;
	for (const entity of profileNames) {
		const name = `${entity.name}\n`;

		let time = null;
		if (entity.lastSeen === null) {
			time = '\u200B\n';
		}
		else {
			const unixTime = Math.floor(new Date(entity.lastSeen).getTime() / 1000);
			time = `${DiscordTools.getDiscordFormattedDate(unixTime)}\n`;
		}

		if ((nameChangeHistoryNameCharacters + name.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
			(nameChangeHistoryTimeCharacters + time.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
			break;
		}

		nameChangeHistoryNameCharacters += name.length;
		nameChangeHistoryTimeCharacters += time.length;

		nameChangeHistoryName += name;
		nameChangeHistoryTime += time;
	}

	let connectionStringCharacters = 0, connectionTimeCharacters = 0;
	for (const connection of bmInstance.players[playerId]['connectionLog']) {
		const str = (connection.type === 0 ? client.intlGet(guildId, 'connected') :
			client.intlGet(guildId, 'disconnected')) + '\n';

		const unixTime = Math.floor(new Date(connection.time).getTime() / 1000);
		const time = `${DiscordTools.getDiscordFormattedDate(unixTime)}\n`;

		if ((connectionStringCharacters + str.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
			(connectionTimeCharacters + time.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
			break;
		}

		connectionStringCharacters += str.length;
		connectionTimeCharacters += time.length;

		connectionString += str;
		connectionTime += time;
	}

	if (nameChangeHistoryName === '') nameChangeHistoryName = client.intlGet(guildId, 'empty');
	if (nameChangeHistoryTime === '') nameChangeHistoryTime = client.intlGet(guildId, 'empty');
	if (connectionString === '') connectionString = client.intlGet(guildId, 'empty');
	if (connectionTime === '') connectionTime = client.intlGet(guildId, 'empty');

	const fields = [
		{
			name: client.intlGet(guildId, 'nameChangeHistory'),
			value: nameChangeHistoryName,
			inline: true
		},
		{
			name: '\u200B',
			value: nameChangeHistoryTime,
			inline: true
		},
		{
			name: '\u200B',
			value: '\u200B',
			inline: false
		},
		{
			name: client.intlGet(guildId, 'connectionEvents'),
			value: connectionString,
			inline: true
		},
		{
			name: '\u200B',
			value: connectionTime,
			inline: true
		}
	];

	embed.setFields(fields);

	await client.interactionEditReply(interaction, { embeds: [embed] });
	client.log(client.intlGet(interaction.guildId, 'infoCap'),
		client.intlGet(interaction.guildId, 'displayingOnlinePlayers'));
}

async function displaySeveralUsers(client, interaction, battlemetricsId, playerIds, search) {
	const bmInstance = client.battlemetricsInstances[battlemetricsId];

	let totalCharacters = 0;
	let fieldCharacters = 0;

	let title = client.intlGet(interaction.guildId, 'playersSearch');
	title += search === null ? '' : `: ${search}`;
	let footer = { text: bmInstance.server_name };

	totalCharacters += title.length;
	totalCharacters += bmInstance.server_name.length;
	totalCharacters += client.intlGet(interaction.guildId, 'andMorePlayers', { number: 100 }).length;
	totalCharacters += `${client.intlGet(interaction.guildId, 'players')}`.length;

	const fields = [''];
	let fieldIndex = 0;
	let isEmbedFull = false;
	let playerCounter = 0;
	for (const playerId of playerIds) {
		playerCounter += 1;

		const status = bmInstance.players[playerId]['status'];
		const time = status ? bmInstance.getOnlineTime(playerId)[1] : bmInstance.getOfflineTime(playerId)[1];

		let playerStr = status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;
		playerStr += ` [${time}] `;

		const nameMaxLength = Constants.EMBED_FIELD_MAX_WIDTH_LENGTH_3 - (3 + time.length);

		let name = bmInstance.players[playerId]['name'].replace('[', '(').replace(']', ')');
		name = name.length <= nameMaxLength ? name : name.substring(0, nameMaxLength - 2) + '..';

		playerStr += `[${name}](${Constants.BATTLEMETRICS_PROFILE_URL + `${playerId}`})\n`;

		if (totalCharacters + playerStr.length >= Constants.EMBED_MAX_TOTAL_CHARACTERS) {
			isEmbedFull = true;
			break;
		}

		if (fieldCharacters + playerStr.length >= Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
			fieldCharacters = 0;
			fieldIndex += 1;
			fields.push('');
		}

		fields[fieldIndex] += playerStr;
		totalCharacters += playerStr.length;
		fieldCharacters += playerStr.length;
	}

	const embed = DiscordEmbeds.getEmbed({
		title: title,
		color: Constants.COLOR_DEFAULT,
		footer: footer
	});

	if (isEmbedFull) {
		embed.setDescription(client.intlGet(interaction.guildId, 'andMorePlayers', {
			number: playerIds.length - playerCounter
		}));
	}

	let fieldCounter = 0;
	for (const field of fields) {
		embed.addFields({
			name: fieldCounter === 0 ? client.intlGet(interaction.guildId, 'players') : '\u200B',
			value: field === '' ? '\u200B' : field,
			inline: true
		});
		fieldCounter += 1;
	}

	await client.interactionEditReply(interaction, { embeds: [embed] });
	client.log(client.intlGet(interaction.guildId, 'infoCap'),
		client.intlGet(interaction.guildId, 'displayingOnlinePlayers'));
}