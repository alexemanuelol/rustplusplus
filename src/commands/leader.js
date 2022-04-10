const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leader')
		.setDescription('Give or take the leadership from/to a team member.')
		.addStringOption(option =>
			option.setName('member')
				.setDescription('The name of the team member.')
				.setRequired(true)),

	async execute(client, interaction) {
		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			await interaction.editReply({
				content: 'No active rustplus instance.',
				ephemeral: true
			});
			client.log('WARNING', 'No active rustplus instance.');
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			let player = rustplus.team.getPlayer(rustplus.playerId);
			await interaction.editReply({
				content: `Leader command only works if the current leader is ${player.name}.`,
				ephemeral: true
			});
			client.log('WARNING', `Leader command only works if the current leader is ${player.name}.`);
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
			await interaction.editReply({
				content: `Could not identify team member: ${member}.`,
				ephemeral: true
			});
			client.log('WARNING', `Could not identify team member: ${member}.`);
		}
		else {
			if (rustplus.team.leaderSteamId === matchedPlayer.steamId) {
				await interaction.editReply({
					content: `${matchedPlayer.name} is already team leader.`,
					ephemeral: true
				});
				client.log('WARNING', `${matchedPlayer.name} is already team leader.`);
			}
			else {
				await rustplus.team.changeLeadership(matchedPlayer.steamId);
				await interaction.editReply({
					content: `Team leadership was transferred to ${matchedPlayer.name}.`,
					ephemeral: true
				});
				client.log('WARNING', `Team leadership was transferred to ${matchedPlayer.name}.`);
			}
		}
	},
};
