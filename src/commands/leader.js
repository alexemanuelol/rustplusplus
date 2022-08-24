const Builder = require('@discordjs/builders');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('leader')
		.setDescription('Give or take the leadership from/to a team member.')
		.addStringOption(option =>
			option.setName('member')
				.setDescription('The name of the team member.')
				.setRequired(true)),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus || (rustplus && !rustplus.ready)) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
			client.log('WARNING', str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			let str = 'Leader command is turned OFF in settings.';
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			let player = rustplus.team.getPlayer(rustplus.playerId);
			let str = `Leader command only works if the current leader is ${player.name}.`;
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
			return;
		}

		let matchedPlayer = null;
		/* Look for parts of the name */
		for (let player of rustplus.team.players) {
			if (player.name.toLowerCase().includes(member.toLowerCase())) {
				matchedPlayer = player;
				break;
			}
		}

		if (matchedPlayer === null) {
			/* Find the closest name */
			for (let player of rustplus.team.players) {
				if (Str.similarity(member, player.name) >= 0.9) {
					matchedPlayer = player;
					break;
				}
			}
		}

		if (matchedPlayer === null) {
			let str = `Could not identify team member: ${member}.`;
			await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log('WARNING', str);
		}
		else {
			if (rustplus.team.leaderSteamId === matchedPlayer.steamId) {
				let str = `${matchedPlayer.name} is already team leader.`;
				await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('WARNING', str);
			}
			else {
				await rustplus.team.changeLeadership(matchedPlayer.steamId);
				let str = `Team leadership was transferred to ${matchedPlayer.name}.`;
				await client.interactionEditReply(interaction, client.getEmbedActionInfo(0, str,
					instance.serverList[rustplus.serverId].title));
				rustplus.log('INFO', str);
			}
		}
	},
};
