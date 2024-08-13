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

import { log } from '../../index';
import * as discordEmbeds from '../discordTools/discord-embeds';
import * as discordTools from '../discordTools/discord-tools';

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
		await client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const member = interaction.options.getString('member');

		log.info(client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${member}`
		}));

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str));
			log.warn(str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			const str = client.intlGet(interaction.guildId, 'leaderCommandIsDisabled');
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.warn(str);
			return;
		}

		if (!Object.keys(instance.serverListLite[rustplus.serverId]).includes(rustplus.teamInfo.leaderSteamId)) {
			let names = '';
			for (const teamMember of rustplus.teamInfo.teamMemberObjects) {
				if (Object.keys(instance.serverListLite[rustplus.serverId]).includes(teamMember.steamId)) {
					names += `${teamMember.name}, `
				}
			}
			names = names.slice(0, -2);

			const str = client.intlGet(rustplus.guildId, 'leaderCommandOnlyWorks', { name: names });
			await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str,
				instance.serverList[rustplus.serverId].title));
			rustplus.warn(str);
			return;
		}

		for (const teamMember of rustplus.teamInfo.teamMemberObjects) {
			if (teamMember.name.includes(member)) {
				if (rustplus.teamInfo.leaderSteamId === teamMember.steamId) {
					const str = client.intlGet(interaction.guildId, 'leaderAlreadyLeader', {
						name: teamMember.name
					});
					await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.warn(str);
				}
				else {
					if (rustplus.generalSettings.leaderCommandOnlyForPaired) {
						if (!Object.keys(instance.serverListLite[rustplus.serverId]).includes(teamMember.steamId)) {
							const str = client.intlGet(rustplus.guildId, 'playerNotPairedWithServer', {
								name: teamMember.name
							});
							await discordTools.interactionEditReply(interaction,
								discordEmbeds.getActionInfoEmbed(1, str,
									instance.serverList[rustplus.serverId].title));
							rustplus.warn(str);
							return;
						}
					}

					if (rustplus.teamInfo.leaderSteamId === rustplus.playerId) {
						await rustplus.teamInfo.promoteTeamMemberToLeader(teamMember.steamId);
					}
					else {
						rustplus.leaderRustPlusInstance.promoteToLeaderAsync(teamMember.steamId);
					}

					const str = client.intlGet(interaction.guildId, 'leaderTransferred', {
						name: teamMember.name
					});
					await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(0, str,
						instance.serverList[rustplus.serverId].title));
					rustplus.info(str);
				}
				return;
			}
		}

		const str = client.intlGet(interaction.guildId, 'couldNotIdentifyMember', { name: member });
		await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str,
			instance.serverList[rustplus.serverId].title));
		rustplus.warn(str);
	},
};