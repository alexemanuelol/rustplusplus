const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('players')
		.setDescription('Get player/players information based on Battlemetrics.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name or part of the name of the player.')
				.setRequired(false)),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		const name = interaction.options.getString('name');

		if (instance.role !== null) {
			if (!interaction.member.permissions.has('ADMINISTRATOR') &&
				!interaction.member.roles.cache.has(instance.role)) {
				let role = DiscordTools.getRole(interaction.guildId, instance.role);
				let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
				await client.interactionReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ff0040')
						.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
					ephemeral: true
				});
				client.log('WARNING', str);
				return;
			}
		}

		await interaction.deferReply({ ephemeral: true });

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('WARNING', str);
			return;
		}

		const battlemetricsId = instance.serverList[rustplus.serverId].battlemetricsId;

		if (battlemetricsId === null) {
			let str = 'This server is using streamer mode.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('WARNING', str);
			return;
		}

		if (!Object.keys(client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
			let str = 'Could not find players for this server.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
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

		let embed = new MessageEmbed()
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
			embed.addField('Players', playerColumns[0], true);
		}
		else if (playerIndex === 2) {
			embed.addField('Players', playerColumns[0], true);
			embed.addField('\u200B', playerColumns[1], true);
		}
		else if (playerIndex >= 3) {
			embed.addField('Players', playerColumns[0], true);
			embed.addField('\u200B', playerColumns[1], true);
			embed.addField('\u200B', playerColumns[2], true);
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
