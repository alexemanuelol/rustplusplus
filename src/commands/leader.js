const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds');

module.exports = {
	name: 'leader',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('leader')
			.setDescription(client.intlGet(guildId, 'commandsLeaderDesc'))
			.addStringOption(option => option
				.setName('member')
				.setDescription(client.intlGet(guildId, 'commandsLeaderMemberDesc'))
				.setRequired(true));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			const str = client.intlGet(interaction.guildId, 'leaderCommandIsDisabled');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			const player = rustplus.team.getPlayer(rustplus.playerId);
			const str = client.intlGet(interaction.guildId, 'leaderCommandOnlyWorks', { name: player.name });
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
			return;
		}

		for (const player of rustplus.team.players) {
			if (player.name.includes(member)) {
				if (rustplus.team.leaderSteamId === player.steamId) {
					const str = client.intlGet(interaction.guildId, 'leaderAlreadyLeader', {
						name: player.name
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
				}
				else {
					await rustplus.team.changeLeadership(player.steamId);
					const str = client.intlGet(interaction.guildId, 'leaderTransferred', {
						name: player.name
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), str);
				}
				return;
			}
		}

		const str = client.intlGet(interaction.guildId, 'couldNotIdentifyMember', { name: member });
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
			instance.serverList[rustplus.serverId].title));
		rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
	},
};