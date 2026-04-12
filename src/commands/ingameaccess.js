/*
	Copyright (C) 2026 FaiThiX

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

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'ingameaccess',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('ingameaccess')
			.setDescription(client.intlGet(guildId, 'commandsInGameAccessDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('mode')
				.setDescription(client.intlGet(guildId, 'commandsInGameAccessModeDesc'))
				.addStringOption(option => option
					.setName('mode')
					.setDescription(client.intlGet(guildId, 'commandsInGameAccessModeOptionDesc'))
					.setRequired(true)
					.addChoices(
						{ name: client.intlGet(guildId, 'blacklist'), value: 'blacklist' },
						{ name: client.intlGet(guildId, 'whitelist'), value: 'whitelist' })))
			.addSubcommand(subcommand => subcommand
				.setName('show')
				.setDescription(client.intlGet(guildId, 'commandsInGameAccessShowDesc')));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;
		const instance = client.getInstance(guildId);
		const rustplus = client.rustplusInstances[guildId];

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;

		if (!client.isAdministrator(interaction)) {
			const str = client.intlGet(guildId, 'missingPermission');
			await client.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(null, 'warningCap'), str);
			return;
		}

		await interaction.deferReply({ ephemeral: true });
		ensureGeneralSettings(instance);

		switch (interaction.options.getSubcommand()) {
			case 'mode': {
				const mode = normalizeAccessMode(interaction.options.getString('mode'));
				instance.generalSettings.inGameCommandAccessMode = mode;
				client.setInstance(guildId, instance);

				if (rustplus) rustplus.generalSettings.inGameCommandAccessMode = mode;

				const str = client.intlGet(guildId, 'inGameCommandAccessModeSet', {
					mode: client.intlGet(guildId, mode)
				});

				client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
					id: `${verifyId}`,
					value: `mode, ${mode}`
				}));

				await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
				client.log(client.intlGet(null, 'infoCap'), str);
				return;
			} break;

			case 'show': {
				const mode = normalizeAccessMode(instance.generalSettings.inGameCommandAccessMode);
				const blacklistCount = getListCount(instance, 'blacklist');
				const whitelistCount = getListCount(instance, 'whitelist');

				await client.interactionEditReply(interaction, {
					embeds: [DiscordEmbeds.getEmbed({
						color: Constants.COLOR_DEFAULT,
						title: client.intlGet(guildId, 'inGameCommandAccess'),
						description: client.intlGet(guildId,
							mode === 'whitelist' ?
								'inGameCommandAccessModeWhitelistInfo' :
								'inGameCommandAccessModeBlacklistInfo'),
						fields: [
							{
								name: client.intlGet(guildId, 'mode'),
								value: client.intlGet(guildId, mode),
								inline: true
							},
							{
								name: client.intlGet(guildId, 'blacklist'),
								value: `${blacklistCount}`,
								inline: true
							},
							{
								name: client.intlGet(guildId, 'whitelist'),
								value: `${whitelistCount}`,
								inline: true
							}]
					})],
					ephemeral: true
				});

				client.log(client.intlGet(null, 'infoCap'),
					client.intlGet(guildId, 'showingInGameCommandAccess'));
				return;
			} break;

			default: {
			} break;
		}
	},
};

function ensureGeneralSettings(instance) {
	if (!instance.hasOwnProperty('generalSettings')) instance.generalSettings = {};
	instance.generalSettings.inGameCommandAccessMode =
		normalizeAccessMode(instance.generalSettings.inGameCommandAccessMode);
}

function normalizeAccessMode(mode) {
	return `${mode || 'blacklist'}`.toLowerCase() === 'whitelist' ? 'whitelist' : 'blacklist';
}

function getListCount(instance, listType) {
	if (!instance.hasOwnProperty(listType)) return 0;
	if (!instance[listType].hasOwnProperty('steamIds')) return 0;
	if (!Array.isArray(instance[listType]['steamIds'])) return 0;
	return instance[listType]['steamIds'].length;
}
