const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('players')
		.setDescription('Get player/players information based on Battlemetrics.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name or part of the name of the player.')
				.setRequired(false)),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		const name = interaction.options.getString('name');

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
			client.log('WARNING', str);
			return;
		}

		const battlemetricsId = instance.serverList[rustplus.serverId].battlemetricsId;

		if (battlemetricsId === null) {
			let str = 'This server is using streamer mode.';
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
			client.log('WARNING', str);
			return;
		}

		if (!Object.keys(client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
			let str = 'Could not find players for this server.';
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
			client.log('WARNING', str);
			return;
		}

		let foundPlayers = [];
		if (name === null) {
			foundPlayers = client.battlemetricsOnlinePlayers[battlemetricsId].slice();
		}
		else {
			for (let player of client.battlemetricsOnlinePlayers[battlemetricsId]) {
				if (player.name.includes(name)) {
					foundPlayers.push(player);
				}
			}
		}

		let allPlayersLength = foundPlayers.length;
		let playerColumns = ['', '', ''];
		let playerIndex = 0;
		let isFull = false;
		for (let player of foundPlayers) {
			let playerStr = `\`[${player.time}] ${player.name}\`\n`;

			if (playerColumns[playerIndex % 3].length + playerStr.length > 1024) {
				isFull = true;
				break;
			}

			playerColumns[playerIndex % 3] += playerStr;
			playerIndex += 1;
		}

		let title = '';
		if (name === null) {
			title = 'Online players';
		}
		else {
			title = `Online players '${name}'`;
		}

		let embed = new Discord.EmbedBuilder()
			.setTitle(title)
			.setColor('#ce412b');

		let description = '';
		if (playerIndex === 0) {
			if (name === null) {
				description = 'Could not find any players.';
			}
			else {
				description = `Could not find a player '${name}'.`;
			}
		}
		else if (playerIndex === 1) {
			embed.addFields({
				name: 'Players', value: playerColumns[0], inline: true
			});
		}
		else if (playerIndex === 2) {
			embed.addFields(
				{ name: 'Players', value: playerColumns[0], inline: true },
				{ name: '\u200B', value: playerColumns[1], inline: true }
			);
		}
		else if (playerIndex >= 3) {
			embed.addFields(
				{ name: 'Players', value: playerColumns[0], inline: true },
				{ name: '\u200B', value: playerColumns[1], inline: true },
				{ name: '\u200B', value: playerColumns[2], inline: true }
			);
		}

		if (description === '' && isFull) {
			description = `... and ${allPlayersLength - playerIndex} more players.`
		}

		if (description !== '') {
			embed.setDescription(description);
		}

		embed.setFooter({ text: instance.serverList[rustplus.serverId].title });

		await client.interactionEditReply(interaction, { embeds: [embed] });
		rustplus.log('INFO', 'Displaying online players.');
	},
};
