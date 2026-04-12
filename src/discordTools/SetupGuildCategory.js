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
const PermissionHandler = require('../handlers/permissionHandler.js');

module.exports = async (client, guild) => {
    const instance = client.getInstance(guild.id);
    const perms = PermissionHandler.getPermissionsReset(client, guild, false);

    let category = undefined;
    if (instance.channelId.category !== null) {
        category = DiscordTools.getCategoryById(guild.id, instance.channelId.category);
        if (category && !botHasChannelPermissions(guild, category)) {
            category = undefined;
        }
    }
    if (category === undefined) {
        category = await DiscordTools.addCategory(guild.id, 'rustplusplus', perms);
        if (!category) {
            return undefined;
        }
        instance.channelId.category = category.id;
        client.setInstance(guild.id, instance);
    }

    try {
        await category.permissionOverwrites.set(perms);
    }
    catch (e) {
        client.log(client.intlGet(null, 'errorCap'),
            `Could not set permission overwrites for category ${category.id}: ${e}`, 'error');
    }

    return category;
};

function botHasChannelPermissions(guild, channel) {
    const me = guild.members?.me;
    if (!me) return true;

    const permissions = channel.permissionsFor(me);
    return permissions?.has([
        Discord.PermissionFlagsBits.ViewChannel,
        Discord.PermissionFlagsBits.ManageChannels
    ]) ?? false;
}
