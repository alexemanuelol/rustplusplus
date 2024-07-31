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

import { Guild, CategoryChannel, ChannelType, TextChannel } from 'discord.js';

import { log, client } from '../../index';
import * as discordTools from './discord-tools';
const PermissionHandler = require('../handlers/permissionHandler.js');

export async function setupGuildChannels(guild: Guild, category: CategoryChannel) {
    const guildId = guild.id;
    await addTextChannel(client.intlGet(guildId, 'channelNameInformation'), 'information', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameServers'), 'servers', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameSettings'), 'settings', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameCommands'), 'commands', guild, category, true);
    await addTextChannel(client.intlGet(guildId, 'channelNameEvents'), 'events', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameTeamchat'), 'teamchat', guild, category, true);
    await addTextChannel(client.intlGet(guildId, 'channelNameSwitches'), 'switches', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameSwitchGroups'), 'switchGroups', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameAlarms'), 'alarms', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameStorageMonitors'),
        'storageMonitors', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameActivity'), 'activity', guild, category);
    await addTextChannel(client.intlGet(guildId, 'channelNameTrackers'), 'trackers', guild, category);
}

async function addTextChannel(name: string, idName: string, guild: Guild, parent: CategoryChannel,
    permissionWrite: boolean = false) {
    const guildId = guild.id;
    const instance = client.getInstance(guildId);

    let channel = undefined;
    if (instance.channelIds[idName] !== null) {
        channel = await discordTools.getTextChannel(guildId, instance.channelIds[idName]);
    }
    if (channel === undefined) {
        channel = await discordTools.createChannel(guildId, name, ChannelType.GuildText) as TextChannel;
        if (!channel) return undefined;
        instance.channelIds[idName] = channel.id;
        client.setInstance(guildId, instance);

        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            log.error(client.intlGet(null, 'couldNotSetParent', { channelId: channel.id }));
        }
    }

    if (instance.firstTime) {
        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            log.error(client.intlGet(null, 'couldNotSetParent', { channelId: channel.id }));
        }
    }

    const perms = PermissionHandler.getPermissionsReset(client, guild, permissionWrite);

    try {
        await channel.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }

    /* Currently, this halts the entire application... Too lazy to fix...
       It is possible to just remove the channels and let the bot recreate them with correct name language */
    //channel.setName(name);

    channel.lockPermissions();
}