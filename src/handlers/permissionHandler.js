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

const Discord = require('discord.js');

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    getPermissionsReset: function (client, guild, permissionWrite = false) {
        const instance = client.getInstance(guild.id);

        const perms = [];
        const everyoneAllow = [];
        const everyoneDeny = [];
        const roleAllow = [];
        const roleDeny = [];

        if (instance.role !== null) {
            if (permissionWrite) {
                roleAllow.push(Discord.PermissionFlagsBits.SendMessages);
            }
            else {
                roleDeny.push(Discord.PermissionFlagsBits.SendMessages);
            }

            everyoneDeny.push(Discord.PermissionFlagsBits.ViewChannel);
            everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);
            roleAllow.push(Discord.PermissionFlagsBits.ViewChannel);

            perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
            perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
        }
        else {
            if (permissionWrite) {
                everyoneAllow.push(Discord.PermissionFlagsBits.SendMessages);
            }
            else {
                everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);
            }

            everyoneAllow.push(Discord.PermissionFlagsBits.ViewChannel);

            perms.push({ id: guild.roles.everyone.id, allow: everyoneAllow, deny: everyoneDeny });
        }

        for (const discordId of instance.blacklist['discordIds']) {
            perms.push({
                id: discordId,
                deny: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages]
            });
        }

        return perms;
    },

    getPermissionsRemoved: function (client, guild) {
        const instance = client.getInstance(guild.id);

        const perms = [];

        if (instance.role !== null) {
            perms.push({
                id: instance.role,
                deny: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages]
            });
        }

        perms.push({
            id: guild.roles.everyone.id,
            deny: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages]
        });

        return perms;
    },

    resetPermissionsAllChannels: async function (client, guild) {
        const instance = client.getInstance(guild.id);

        if (instance.channelId.category === null) return;

        const category = await DiscordTools.getCategoryById(guild.id, instance.channelId.category);
        if (category) {
            const perms = module.exports.getPermissionsReset(client, guild);
            try {
                await category.permissionOverwrites.set(perms);
            }
            catch (e) {
                /* Ignore */
            }
        }

        for (const [name, id] of Object.entries(instance.channelId)) {
            const writePerm = (name !== 'commands' && name !== 'teamchat') ? false : true;

            const channel = DiscordTools.getTextChannelById(guild.id, id);
            if (channel) {
                const perms = module.exports.getPermissionsReset(client, guild, writePerm);
                try {
                    await channel.permissionOverwrites.set(perms);
                }
                catch (e) {
                    /* Ignore */
                }
            }
        }
    },
}