/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${member}`
		}));

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

		if (!Object.keys(instance.serverListLite[rustplus.serverId]).includes(rustplus.team.leaderSteamId)) {
			let names = '';
			for (const player of rustplus.team.players) {
				if (Object.keys(instance.serverListLite[rustplus.serverId]).includes(player.steamId)) {
					names += `${player.name}, `
				}
			}
			names = names.slice(0, -2);

			const str = client.intlGet(rustplus.guildId, 'leaderCommandOnlyWorks', { name: names });
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
					if (rustplus.generalSettings.leaderCommandOnlyForPaired) {
						if (!Object.keys(instance.serverListLite[rustplus.serverId]).includes(player.steamId)) {
							const str = client.intlGet(rustplus.guildId, 'playerNotPairedWithServer', {
								name: player.name
							});
							await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
								instance.serverList[rustplus.serverId].title));
							rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
							return;
						}
					}

					if (rustplus.team.leaderSteamId === rustplus.playerId) {
						await rustplus.team.changeLeadership(player.steamId);
					}
					else {
						rustplus.leaderRustPlusInstance.promoteToLeaderAsync(player.steamId);
					}

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