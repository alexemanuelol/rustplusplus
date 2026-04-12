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

module.exports = async (client, guild, category) => {
    if (!category) {
        return;
    }

    await addTextChannel(client.intlGet(guild.id, 'channelNameInformation'), 'information', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameServers'), 'servers', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameSettings'), 'settings', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameCommands'), 'commands', client, guild, category, true);
    await addTextChannel(client.intlGet(guild.id, 'channelNameEvents'), 'events', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameTeamchat'), 'teamchat', client, guild, category, true);
    await addTextChannel(client.intlGet(guild.id, 'channelNameSwitches'), 'switches', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameSwitchGroups'), 'switchGroups', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameAlarms'), 'alarms', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameStorageMonitors'),
        'storageMonitors', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameActivity'), 'activity', client, guild, category);
    await addTextChannel(client.intlGet(guild.id, 'channelNameTrackers'), 'trackers', client, guild, category);
};

async function addTextChannel(name, idName, client, guild, parent, permissionWrite = false) {
    const instance = client.getInstance(guild.id);
    const perms = PermissionHandler.getPermissionsReset(client, guild, permissionWrite);

    let channel = undefined;
    if (instance.channelId[idName] !== null) {
        channel = DiscordTools.getTextChannelById(guild.id, instance.channelId[idName]);
        if (channel && !botCanUseTextChannel(guild, channel)) {
            instance.channelId[idName] = null;
            client.setInstance(guild.id, instance);
            channel = undefined;
        }
    }
    if (channel === undefined) {
        channel = await DiscordTools.addTextChannel(guild.id, name, parent.id, perms);
        if (!channel) {
            return;
        }
        instance.channelId[idName] = channel.id;
        client.setInstance(guild.id, instance);
    }

    if (channel && (instance.firstTime || channel.parentId !== parent.id)) {
        try {
            await channel.setParent(parent.id, { lockPermissions: false });
        }
        catch (e) {
            client.log(client.intlGet(null, 'errorCap'),
                `${client.intlGet(null, 'couldNotSetParent', { channelId: channel.id })}: ${e}`, 'error');
        }
    }

    try {
        await channel.permissionOverwrites.set(perms);
    }
    catch (e) {
        client.log(client.intlGet(null, 'errorCap'),
            `Could not set permission overwrites for channel ${channel.id}: ${e}`, 'error');
    }

    /* Currently, this halts the entire application... Too lazy to fix...
       It is possible to just remove the channels and let the bot recreate them with correct name language */
    //channel.setName(name);
}

function botCanUseTextChannel(guild, channel) {
    const me = guild.members?.me;
    if (!me) return true;

    const permissions = channel.permissionsFor(me);
    return permissions?.has([
        Discord.PermissionFlagsBits.ViewChannel,
        Discord.PermissionFlagsBits.SendMessages,
        Discord.PermissionFlagsBits.ManageChannels
    ]) ?? false;
}
