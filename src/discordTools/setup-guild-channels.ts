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

import { log, localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as discordTools from './discord-tools';
import { getPermissionsReset } from '../handlers/permission-handler';
const Config = require('../../config');

export async function setupGuildChannels(guild: Guild, category: CategoryChannel) {
    const guildId = guild.id;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    await addTextChannel(lm.getIntl(language, 'channelNameInformation'), 'information', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameServers'), 'servers', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameSettings'), 'settings', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameCommands'), 'commands', guild, category, true);
    await addTextChannel(lm.getIntl(language, 'channelNameEvents'), 'events', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameTeamchat'), 'teamchat', guild, category, true);
    await addTextChannel(lm.getIntl(language, 'channelNameSwitches'), 'switches', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameSwitchGroups'), 'switchGroups', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameAlarms'), 'alarms', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameStorageMonitors'), 'storageMonitors', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameActivity'), 'activity', guild, category);
    await addTextChannel(lm.getIntl(language, 'channelNameTrackers'), 'trackers', guild, category);
}

async function addTextChannel(name: string, idName: string, guild: Guild, parent: CategoryChannel,
    permissionWrite: boolean = false) {
    const guildId = guild.id;
    const instance = guildInstance.readGuildInstanceFile(guildId);

    let channel = undefined;
    if (instance.channelIds[idName as keyof guildInstance.ChannelIds] !== null) {
        channel = await discordTools.getTextChannel(guildId,
            instance.channelIds[idName as keyof guildInstance.ChannelIds] as string);
    }
    if (channel === undefined) {
        channel = await discordTools.createChannel(guildId, name, ChannelType.GuildText) as TextChannel;
        if (!channel) return undefined;
        instance.channelIds[idName as keyof guildInstance.ChannelIds] = channel.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            log.error(lm.getIntl(Config.general.language, 'couldNotSetParent', { channelId: channel.id }));
        }
    }

    if (instance.firstTime) {
        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            log.error(lm.getIntl(Config.general.language, 'couldNotSetParent', { channelId: channel.id }));
        }
    }

    const perms = getPermissionsReset(guild, permissionWrite);

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