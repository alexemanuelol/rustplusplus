/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 Squidysquid1

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

const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'voice',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('voice')
            .setDescription(client.intlGet(guildId, 'commandsVoiceDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('vcjoin')
				.setDescription(client.intlGet(guildId, 'commandsVcJoinDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('vcleave')
                .setDescription(client.intlGet(guildId, 'commandsVcLeaveDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('vcsettings')
                .setDescription(client.intlGet(guildId, 'commandsVcSettingsDesc'))
                .addStringOption(option => option
                    .setName('gender')
                    .setDescription(client.intlGet(guildId, 'commandsVcSettingsGenderDesc'))
                    .setRequired(true))
                    .addChoices(
                        { name: client.intlGet(guildId, 'commandsVcMale'), value: 'Male' },
                        { name: client.intlGet(guildId, 'commandsVcFemale'), value: 'Female' }))

    },

    async execute(client, interaction) {
        const instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'vcjoin': {
			} break;

            case 'vcleave': {
            } break;

            case 'vcsettings': {
            } break;

			default: {
			} break;
		}
    }
};