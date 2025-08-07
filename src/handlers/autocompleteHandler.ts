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
import * as rp from 'rustplus-ts';

import { log, guildInstanceManager as gim, credentialsManager as cm, localeManager as lm } from '../../index';
import * as types from '../utils/types';
import { DiscordManager } from "../managers/discordManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { Credentials } from '../managers/credentialsManager';
import { fetchSteamProfileName } from '../utils/steam';

export async function autocompleteHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction):
    Promise<boolean> {
    const fn = '[autocompleteHandler]';
    const logParam = {
        guildId: interaction.guildId as types.GuildId
    };

    const commandName = interaction.commandName;

    if (commandName === 'alias') {
        autocompleteAliasHandler(dm, interaction);
    }
    else if (commandName === 'role') {
        autocompleteRoleHandler(dm, interaction);
    }
    else if (commandName === 'credentials') {
        await autocompleteCredentialsHandler(dm, interaction);
    }
    else if (commandName === 'blacklist') {
        await autocompleteBlacklistHandler(dm, interaction);
    }
    else if (commandName === 'smartalarm') {
        await autocompleteSmartalarmHandler(dm, interaction);
    }
    else if (commandName === 'smartswitch') {
        await autocompleteSmartswitchHandler(dm, interaction);
    }
    else if (commandName === 'storagemonitor') {
        await autocompleteStoragemonitorHandler(dm, interaction);
    }
    else if (commandName === 'map') {
        await autocompleteMapHandler(dm, interaction);
    }
    else {
        log.error(`${fn} Command '${commandName}' have unknown autocomplete interaction.`, logParam);
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

async function autocompleteCredentialsHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'remove': {
            const discordUserId = interaction.user.id;

            const filteredSteamIds: { name: string; value: string }[] = [];
            const steamIds = cm.getCredentialSteamIds();
            for (const steamId of steamIds) {
                const credentials = cm.getCredentials(steamId) as Credentials;
                const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
                if (associatedGuilds.includes(guildId)) {
                    if (credentials.discordUserId === discordUserId) {
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

async function autocompleteAliasHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'remove': {
            const filteredAliases: { name: string; value: string }[] = [];

            const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
            for (const alias of gInstance.aliases) {
                filteredAliases.push({
                    name: `${alias.alias} (${alias.value})`,
                    value: alias.alias
                });
            }

            interaction.respond(filteredAliases.slice(0, 25)); /* Discord limits autocomplete choices to 25 max */

        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

async function autocompleteBlacklistHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction, true)) {
        return interaction.respond([]);
    }

    const options = interaction.options;
    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const focusedOption = options.getFocused(true);

    switch (options.getSubcommand()) {
        case 'remove': {
            if (focusedOption.name === 'discord_user') {
                const filteredDiscordUsers: { name: string; value: string }[] = [];
                for (const userId of gInstance.blacklist.userIds) {
                    const member = await dm.getMember(guildId, userId);
                    const name = member ? member.displayName : lm.getIntl(language, 'unknown');
                    filteredDiscordUsers.push({
                        name: `${name} (${userId})`,
                        value: userId
                    });
                }

                /* Discord limits autocomplete choices to 25 max */
                interaction.respond(filteredDiscordUsers.slice(0, 25));
            }
            else if (focusedOption.name === 'steamid') {
                const filteredSteamUsers: { name: string; value: string }[] = [];
                for (const steamid of gInstance.blacklist.steamIds) {
                    const steamName = await fetchSteamProfileName(steamid);
                    const name = steamName ? steamName : lm.getIntl(language, 'unknown');
                    filteredSteamUsers.push({
                        name: `${name} (${steamid})`,
                        value: steamid
                    });
                }

                /* Discord limits autocomplete choices to 25 max */
                interaction.respond(filteredSteamUsers.slice(0, 25));
            }
            else {
                interaction.respond([]);
            }
        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

async function autocompleteSmartalarmHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'edit': {
            const filteredSmartalarms: { name: string; value: string }[] = [];
            const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
            const entities = gim.getSmartDeviceEntities(guildId, rp.AppEntityType.Alarm);

            for (const entity of entities) {
                const name = gInstance.serverInfoMap[entity.serverId].smartAlarmConfigMap[entity.entityId].name;
                filteredSmartalarms.push({
                    name: `${name} (${entity.entityId})`,
                    value: entity.entityId
                });
            }

            /* Discord limits autocomplete choices to 25 max */
            interaction.respond(filteredSmartalarms.slice(0, 25));

        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

async function autocompleteSmartswitchHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'edit': {
            const filteredSmartswitches: { name: string; value: string }[] = [];
            const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
            const entities = gim.getSmartDeviceEntities(guildId, rp.AppEntityType.Switch);

            for (const entity of entities) {
                const name = gInstance.serverInfoMap[entity.serverId].smartSwitchConfigMap[entity.entityId].name;
                filteredSmartswitches.push({
                    name: `${name} (${entity.entityId})`,
                    value: entity.entityId
                });
            }

            /* Discord limits autocomplete choices to 25 max */
            interaction.respond(filteredSmartswitches.slice(0, 25));

        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

async function autocompleteStoragemonitorHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);

    switch (interaction.options.getSubcommand()) {
        case 'edit': {
            const filteredStoragemonitors: { name: string; value: string }[] = [];
            const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
            const entities = gim.getSmartDeviceEntities(guildId, rp.AppEntityType.StorageMonitor);

            for (const entity of entities) {
                const name = gInstance.serverInfoMap[entity.serverId].storageMonitorConfigMap[entity.entityId].name;
                filteredStoragemonitors.push({
                    name: `${name} (${entity.entityId})`,
                    value: entity.entityId
                });
            }

            /* Discord limits autocomplete choices to 25 max */
            interaction.respond(filteredStoragemonitors.slice(0, 25));

        } break;

        default: {
            interaction.respond([]);
        } break;
    }
}

async function autocompleteMapHandler(dm: DiscordManager, interaction: discordjs.AutocompleteInteraction) {
    if (!dm.validPermissions(interaction)) {
        return interaction.respond([]);
    }

    const options = interaction.options;
    const guildId = interaction.guildId as types.GuildId;
    if (!guildId) return interaction.respond([]);
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const focusedOption = options.getFocused(true);

    if (focusedOption.name === 'server') {
        const filteredServerIds: { name: string; value: string }[] = [];
        for (const [serverId, serverInfo] of Object.entries(gInstance.serverInfoMap)) {
            filteredServerIds.push({
                name: serverInfo.name,
                value: serverId
            });
        }

        /* Discord limits autocomplete choices to 25 max */
        interaction.respond(filteredServerIds.slice(0, 25));
    }
    else {
        interaction.respond([]);
    }
}