const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'players',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('players')
			.setDescription(client.intlGet(guildId, 'commandsPlayersDesc'))
			.addStringOption(option => option
				.setName('name')
				.setDescription(client.intlGet(guildId, 'commandsPlayersNameDesc'))
				.setRequired(false));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const name = interaction.options.getString('name');

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		const battlemetricsId = instance.serverList[rustplus.serverId].battlemetricsId;
		if (battlemetricsId === null) {
			const str = client.intlGet(interaction.guildId, 'serverUsingStreamerMode');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		if (!Object.keys(client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
			const str = client.intlGet(interaction.guildId, 'couldNotFindPlayersForThisServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		let foundPlayers = [];
		if (name === null) {
			foundPlayers = client.battlemetricsOnlinePlayers[battlemetricsId].slice();
		}
		else {
			for (const player of client.battlemetricsOnlinePlayers[battlemetricsId]) {
				if (player.name.includes(name)) {
					foundPlayers.push(player);
				}
			}
		}

		const allPlayersLength = foundPlayers.length;
		const playerColumns = ['', '', ''];
		let playerIndex = 0;
		let isFull = false;
		for (const player of foundPlayers) {
			const playerStr = `\`[${player.time}] ${player.name}\`\n`;

			if (playerColumns[playerIndex % 3].length + playerStr.length > 1024) {
				isFull = true;
				break;
			}

			playerColumns[playerIndex % 3] += playerStr;
			playerIndex += 1;
		}

		let title = client.intlGet(interaction.guildId, 'onlinePlayers');
		if (name !== null) {
			title += ` '${name}'`;
		}

		const embed = DiscordEmbeds.getEmbed({
			title: title,
			color: '#ce412b'
		});

		let description = '';
		if (playerIndex === 0) {
			if (name === null) {
				description = client.intlGet(interaction.guildId, 'couldNotFindAnyPlayers');
			}
			else {
				description = client.intlGet(interaction.guildId, 'couldNotFindPlayer', {
					name: name
				});
			}
		}
		else if (playerIndex === 1) {
			embed.addFields({
				name: client.intlGet(interaction.guildId, 'players'), value: playerColumns[0], inline: true
			});
		}
		else if (playerIndex === 2) {
			embed.addFields(
				{ name: client.intlGet(interaction.guildId, 'players'), value: playerColumns[0], inline: true },
				{ name: '\u200B', value: playerColumns[1], inline: true }
			);
		}
		else if (playerIndex >= 3) {
			embed.addFields(
				{ name: client.intlGet(interaction.guildId, 'players'), value: playerColumns[0], inline: true },
				{ name: '\u200B', value: playerColumns[1], inline: true },
				{ name: '\u200B', value: playerColumns[2], inline: true }
			);
		}

		if (description === '' && isFull) {
			description = client.intlGet(interaction.guildId, 'andMorePlayers', {
				number: allPlayersLength - playerIndex
			});
		}

		if (description !== '') {
			embed.setDescription(description);
		}

		embed.setFooter({ text: instance.serverList[rustplus.serverId].title });

		await client.interactionEditReply(interaction, { embeds: [embed] });
		rustplus.log(client.intlGet(interaction.guildId, 'infoCap'),
			client.intlGet(interaction.guildId, 'displayingOnlinePlayers'));
	},
};
