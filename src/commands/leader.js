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
			client.log(client.intlGet(null, 'warning'), str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			const str = client.intlGet(interaction.guildId, 'commandsLeaderDisabled');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log(client.intlGet(interaction.guildId, 'warning'), str);
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			const player = rustplus.team.getPlayer(rustplus.playerId);
			const str = client.intlGet(interaction.guildId, 'commandsLeaderOnlyWorks', {
				name: player.name
			});
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.log(client.intlGet(interaction.guildId, 'warning'), str);
			return;
		}

		for (const player of rustplus.team.players) {
			if (player.name.includes(member)) {
				if (rustplus.team.leaderSteamId === player.steamId) {
					const str = client.intlGet(interaction.guildId, 'commandsLeaderAlreadyLeader', {
						name: player.name
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log(client.intlGet(interaction.guildId, 'warning'), str);
				}
				else {
					await rustplus.team.changeLeadership(player.steamId);
					const str = client.intlGet(interaction.guildId, 'commandsLeaderTransferred', {
						name: player.name
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.log(client.intlGet(interaction.guildId, 'info'), str);
				}
				return;
			}
		}

		const str = client.intlGet(interaction.guildId, 'commandsLeaderCouldNotIdentify', {
			name: member
		});
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
			instance.serverList[rustplus.serverId].title));
		rustplus.log(client.intlGet(interaction.guildId, 'warning'), str);
	},
};