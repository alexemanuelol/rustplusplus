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

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    removeViewPermission: async function (client, guild) {
        const instance = client.getInstance(guild.id);

        if (instance.channelId.category === null) return;

        const category = await DiscordTools.getCategoryById(guild.id, instance.channelId.category);

        if (instance.role !== null) {
            await category.permissionOverwrites.edit(
                instance.role, {
                ViewChannel: false
            });
        }

        await category.permissionOverwrites.edit(
            guild.roles.everyone.id, {
            ViewChannel: false
        });
    },

    resetPermissions: async function (client, guild) {
        const instance = client.getInstance(guild.id);

        if (instance.channelId.category === null) return;

        const category = await DiscordTools.getCategoryById(guild.id, instance.channelId.category);

        await category.permissionOverwrites.edit(
            instance.role === null ? guild.roles.everyone.id : instance.role, {
            ViewChannel: true
        });

        for (const [name, id] of Object.entries(instance.channelId)) {
            if (name !== 'commands' && name !== 'teamchat') continue;

            const channel = DiscordTools.getTextChannelById(guild.id, id);
            await channel.permissionOverwrites.edit(
                instance.role === null ? guild.roles.everyone.id : instance.role, {
                SendMessages: true
            });
        }
    },
}