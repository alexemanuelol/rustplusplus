/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import * as guildInstance from '../util/guild-instance';
import * as discordTools from '../discordTools/discord-tools';

export function getPermissionsReset(guild: discordjs.Guild, permissionWrite: boolean = false):
    discordjs.OverwriteData[] {
    const instance = guildInstance.readGuildInstanceFile(guild.id);

    const perms = [];
    const everyoneAllow = [];
    const everyoneDeny = [];
    const roleAllow = [];
    const roleDeny = [];

    if (instance.roleId !== null) {
        if (permissionWrite) {
            roleAllow.push(discordjs.PermissionFlagsBits.SendMessages);
        }
        else {
            roleDeny.push(discordjs.PermissionFlagsBits.SendMessages);
        }

        everyoneDeny.push(discordjs.PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(discordjs.PermissionFlagsBits.SendMessages);
        roleAllow.push(discordjs.PermissionFlagsBits.ViewChannel);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.roleId, allow: roleAllow, deny: roleDeny });
    }
    else {
        if (permissionWrite) {
            everyoneAllow.push(discordjs.PermissionFlagsBits.SendMessages);
        }
        else {
            everyoneDeny.push(discordjs.PermissionFlagsBits.SendMessages);
        }

        everyoneAllow.push(discordjs.PermissionFlagsBits.ViewChannel);

        perms.push({ id: guild.roles.everyone.id, allow: everyoneAllow, deny: everyoneDeny });
    }

    for (const discordId of instance.blacklist['discordIds']) {
        perms.push({
            id: discordId,
            deny: [discordjs.PermissionFlagsBits.ViewChannel, discordjs.PermissionFlagsBits.SendMessages]
        });
    }

    return perms;
}

export function getPermissionsRemoved(guild: discordjs.Guild): discordjs.OverwriteData[] {
    const instance = guildInstance.readGuildInstanceFile(guild.id);

    const perms = [];

    if (instance.roleId !== null) {
        perms.push({
            id: instance.roleId,
            deny: [discordjs.PermissionFlagsBits.ViewChannel, discordjs.PermissionFlagsBits.SendMessages]
        });
    }

    perms.push({
        id: guild.roles.everyone.id,
        deny: [discordjs.PermissionFlagsBits.ViewChannel, discordjs.PermissionFlagsBits.SendMessages]
    });

    return perms;
}

export async function resetPermissionsAllChannels(guild: discordjs.Guild) {
    const instance = guildInstance.readGuildInstanceFile(guild.id);

    if (instance.channelIds.category === null) return;

    const category = await discordTools.getCategory(guild.id, instance.channelIds.category);
    if (category) {
        const perms = getPermissionsReset(guild);
        try {
            await category.permissionOverwrites.set(perms);
        }
        catch (e) { }
    }

    for (const [name, id] of Object.entries(instance.channelIds)) {
        const writePerm = (name !== 'commands' && name !== 'teamchat') ? false : true;

        const channel = await discordTools.getTextChannel(guild.id, id);
        if (channel) {
            const perms = getPermissionsReset(guild, writePerm);
            try {
                await channel.permissionOverwrites.set(perms);
            }
            catch (e) { }
        }
    }
}