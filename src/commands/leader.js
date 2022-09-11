const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('leader')
		.setDescription('Give or take the leadership from/to a team member.')
		.addStringOption(option => option
			.setName('member')
			.setDescription('The name of the team member.')
			.setRequired(true)),

	async execute(client, interaction) {
		const instance = client.readInstanceFile(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log('WARNING', str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			const str = 'Leader command is turned OFF in settings.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			const player = rustplus.team.getPlayer(rustplus.playerId);
			const str = `Leader command only works if the current leader is ${player.name}.`;
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
			return;
		}

		let matchedPlayer = null;
		/* Look for parts of the name */
		for (const player of rustplus.team.players) {
			if (player.name.toLowerCase().includes(member.toLowerCase())) {
				matchedPlayer = player;
				break;
			}
		}

		if (matchedPlayer === null) {
			/* Find the closest name */
			for (const player of rustplus.team.players) {
				if (Str.similarity(member, player.name) >= 0.9) {
					matchedPlayer = player;
					break;
				}
			}
		}

		if (matchedPlayer === null) {
			const str = `Could not identify team member: ${member}.`;
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
		}
		else {
			if (rustplus.team.leaderSteamId === matchedPlayer.steamId) {
				const str = `${matchedPlayer.name} is already team leader.`;
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('WARNING', str);
			}
			else {
				await rustplus.team.changeLeadership(matchedPlayer.steamId);
				const str = `Team leadership was transferred to ${matchedPlayer.name}.`;
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('INFO', str);
			}
		}
	},
};