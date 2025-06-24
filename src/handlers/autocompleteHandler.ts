/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';

import { log, guildInstanceManager as gim, credentialsManager as cm } from '../../index';
import * as types from '../utils/types';
import { DiscordManager } from "../managers/discordManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { Credentials } from '../managers/credentialsManager';

export async function autocompleteHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction):
    Promise<boolean> {
    const fName = '[autocompleteHandler]';
    const logParam = { guildId: interaction.guildId as types.GuildId };

    const commandName = interaction.commandName;

    if (commandName === 'role') {
        autocompleteRoleHandler(dm, interaction);
    }
    else if (commandName === 'credentials') {
        autocompleteCredentialsHandler(dm, interaction);
    }
    else {
        log.error(`${fName} Command '${commandName}' have unknown autocomplete interaction.`, logParam);
        return false;
    }

    return true;
}

function autocompleteRoleHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction, true)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const type = interaction.options.getString('type', true) as 'roleIds' | 'adminIds';

    switch (interaction.options.getSubcommand()) {
        case 'add': {
            const roleIds = gInstance[type];

            /* Filter out roles that are already configured. */
            const filteredRoles = interaction.guild!.roles.cache
                .filter(role => !roleIds.includes(role.id))  /* Exclude already configured roles */
                .map(role => ({ name: role.name, value: role.id }))  /* Map to name-value pairs */
                .slice(0, 25);  /* Discord limits autocomplete choices to 25 max */

            interaction.respond(filteredRoles);
        } break;

        case 'remove': {
            /* Get only roles stored in the configuration */
            const filteredRoles = interaction.guild!.roles.cache
                .filter(role => gInstance[type].includes(role.id)) /* Only show stored roles */
                .map(role => ({ name: role.name, value: role.id })) /* Map to name-value pairs */
                .slice(0, 25); /* Discord limits autocomplete choices to 25 max */

            interaction.respond(filteredRoles);
        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

function autocompleteCredentialsHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'remove': {
            const discordUserId = interaction.user.id;
            const isAdmin = dm.isAdministrator(interaction);

            const filteredSteamIds: { name: string; value: string }[] = [];
            const steamIds = cm.getCredentialSteamIds();
            for (const steamId of steamIds) {
                const credentials = cm.getCredentials(steamId) as Credentials;
                if (credentials.associatedGuilds.includes(guildId)) {
                    if (isAdmin || credentials.discordUserId === discordUserId) {
                        filteredSteamIds.push({ name: steamId, value: steamId });
                    }
                }
            }

            interaction.respond(filteredSteamIds.slice(0, 25)); /* Discord limits autocomplete choices to 25 max */

        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}