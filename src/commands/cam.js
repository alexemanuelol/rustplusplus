/*
	Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
	name: 'cam',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('cam')
			.setDescription(client.intlGet(guildId, 'commandsCamDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('create')
				.setDescription(client.intlGet(guildId, 'commandsCamCreateDesc'))
				.addStringOption(option => option
					.setName('name')
					.setDescription(client.intlGet(guildId, 'commandsCamGroupDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('destroy')
				.setDescription(client.intlGet(guildId, 'commandsCamDestroyDesc'))
				.addStringOption(option => option
					.setName('name')
					.setDescription(client.intlGet(guildId, 'commandsCamGroupDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(client.intlGet(guildId, 'commandsCamAddDesc'))
				.addStringOption(option => option
					.setName('group')
					.setDescription(client.intlGet(guildId, 'commandsCamGroupDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('id')
					.setDescription(client.intlGet(guildId, 'commandsCamIdDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(client.intlGet(guildId, 'commandsCamRemoveDesc'))
				.addStringOption(option => option
					.setName('group')
					.setDescription(client.intlGet(guildId, 'commandsCamGroupDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('id')
					.setDescription(client.intlGet(guildId, 'commandsCamIdDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('show')
				.setDescription(client.intlGet(guildId, 'commandsCamShowDesc')));
	},

	async execute(client, interaction) {
		const instance = client.getInstance(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!rustplus || (rustplus && !rustplus.isOperational)) {
			const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'create': {
				const name = interaction.options.getString('name');

				if (['airfield', 'bandit', 'dome', 'large', 'outpost', 'small'].includes(name)) {
					const str = client.intlGet(interaction.guildId, 'invalidCameraGroupCreation', { group: name });
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				if (instance.serverList[rustplus.serverId].customCameraGroups.hasOwnProperty(name)) {
					const str = client.intlGet(interaction.guildId, 'cameraGroupAlreadyExist', { group: name });
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				instance.serverList[rustplus.serverId].customCameraGroups[name] = [];
				client.setInstance(interaction.guildId, instance);

				const str = client.intlGet(interaction.guildId, 'createdCameraGroupSuccess', { group: name });
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			case 'destroy': {
				const name = interaction.options.getString('name');

				if (!instance.serverList[rustplus.serverId].customCameraGroups.hasOwnProperty(name)) {
					const str = client.intlGet(interaction.guildId, 'cameraGroupDoesNotExist', { group: name });
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				delete instance.serverList[rustplus.serverId].customCameraGroups[name];
				client.setInstance(interaction.guildId, instance);

				const str = client.intlGet(interaction.guildId, 'removedCameraGroupSuccess', { group: name });
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			case 'add': {
				const group = interaction.options.getString('group');
				const id = interaction.options.getString('id');

				if (!instance.serverList[rustplus.serverId].customCameraGroups.hasOwnProperty(group)) {
					const str = client.intlGet(interaction.guildId, 'cameraGroupDoesNotExist', { group: group });
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				if (instance.serverList[rustplus.serverId].customCameraGroups[group].includes(id)) {
					const str = client.intlGet(interaction.guildId, 'cameraIdAlreadyInGroup', {
						id: id, group: group
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				instance.serverList[rustplus.serverId].customCameraGroups[group].push(id);
				client.setInstance(interaction.guildId, instance);

				const str = client.intlGet(interaction.guildId, 'cameraIdAddedSuccess', { id: id, group: group });
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			case 'remove': {
				const group = interaction.options.getString('group');
				const id = interaction.options.getString('id');

				if (!instance.serverList[rustplus.serverId].customCameraGroups.hasOwnProperty(group)) {
					const str = client.intlGet(interaction.guildId, 'cameraGroupDoesNotExist', { group: group });
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				if (!instance.serverList[rustplus.serverId].customCameraGroups[group].includes(id)) {
					const str = client.intlGet(interaction.guildId, 'cameraIdNotInGroup', {
						id: id, group: group
					});
					await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
						instance.serverList[rustplus.serverId].title));
					client.log(client.intlGet(null, 'warningCap'), str);
					return;
				}

				instance.serverList[rustplus.serverId].customCameraGroups[group] =
					instance.serverList[rustplus.serverId].customCameraGroups[group].filter(e => e !== id);
				client.setInstance(interaction.guildId, instance);

				const str = client.intlGet(interaction.guildId, 'cameraIdRemovedSuccess', { id: id, group: group });
				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
					instance.serverList[rustplus.serverId].title));
				client.log(client.intlGet(null, 'infoCap'), str);
			} break;

			case 'show': {
				await DiscordMessages.sendCameraGroupShowMessage(interaction, rustplus);
			} break;

			default: {
			} break;
		}
	},
};
