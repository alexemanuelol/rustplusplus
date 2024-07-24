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

import { Guild, Role, GuildMember, GuildBasedChannel, TextChannel, ChannelType, CategoryChannel, Message, PermissionFlagsBits } from 'discord.js';

import { log } from '../../index';
import { localeManager as lm } from '../../index';
const Config = require('../../config');
const { DiscordBot } = require('../structures/DiscordBot.js');

export async function getGuild(client: typeof DiscordBot, guildId: string): Promise<Guild | undefined> {
    try {
        if (!Config.discord.useCache) {
            await client.guilds.fetch();
        }

        return client.guilds.cache.get(guildId);
    }
    catch (e) { }
    log.error(lm.getIntl(Config.general.language, 'couldNotFindGuild', { guildId: guildId }));
    return undefined;
}

export async function getRole(client: typeof DiscordBot, guildId: string, role: string, isRoleId: boolean = true):
    Promise<Role | undefined> {
    const guild = await getGuild(client, guildId);

    if (guild instanceof Guild) {
        try {
            if (!Config.discord.useCache) {
                await guild.roles.fetch();
            }

            if (isRoleId) {
                return guild.roles.cache.get(role);
            }
            else {
                return guild.roles.cache.find(r => r.name === role);
            }
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotFindRole', { role: role }));
    return undefined;
}

export async function getMember(client: typeof DiscordBot, guildId: string, member: string, isMemberId: boolean = true):
    Promise<GuildMember | undefined> {
    const guild = await getGuild(client, guildId);

    if (guild instanceof Guild) {
        try {
            if (!Config.discord.useCache) {
                await guild.members.fetch();
            }

            if (isMemberId) {
                return guild.members.cache.get(member);
            }
            else {
                return guild.members.cache.find(m => m.user.username === member);
            }
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotFindGuildMember', { member: member }));
    return undefined;
}

async function getChannel(client: typeof DiscordBot, guildId: string, channel: string, isChannelId: boolean = true):
    Promise<GuildBasedChannel | undefined> {
    const guild = await getGuild(client, guildId);

    if (guild instanceof Guild) {
        try {
            if (!Config.discord.useCache) {
                await guild.channels.fetch();
            }

            if (isChannelId) {
                return guild.channels.cache.get(channel);
            }
            else {
                return guild.channels.cache.find(c => c.name === channel);
            }
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotFindChannel', { channel: channel }));
    return undefined;
}

export async function getTextChannel(client: typeof DiscordBot, guildId: string, channel: string,
    isChannelId: boolean = true): Promise<TextChannel | undefined> {
    const ch = await getChannel(client, guildId, channel, isChannelId);
    if (ch && ch.type === ChannelType.GuildText) {
        return ch as TextChannel;
    }
    return undefined;
}

export async function getCategory(client: typeof DiscordBot, guildId: string, category: string,
    isCategoryId: boolean = true): Promise<CategoryChannel | undefined> {
    const categoryChannel = await getChannel(client, guildId, category, isCategoryId);
    if (categoryChannel && categoryChannel.type === ChannelType.GuildCategory) {
        return categoryChannel as CategoryChannel;
    }
    return undefined;
}

export async function getMessage(client: typeof DiscordBot, guildId: string, channelId: string, messageId: string):
    Promise<Message | undefined> {
    const guild = await getGuild(client, guildId);

    if (guild instanceof Guild) {
        const channel = await getTextChannel(client, guildId, channelId);

        if (channel instanceof TextChannel) {
            try {
                /* Fetching the specific messageId because otherwise it only fetches last 50 messages. */
                await channel.messages.fetch(messageId);
                return channel.messages.cache.get(messageId);
            }
            catch (e) { }
        }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotFindMessage', { message: messageId }));
    return undefined;
}

export async function deleteMessage(client: typeof DiscordBot, guildId: string, channelId: string, messageId: string):
    Promise<boolean> {
    const message = await getMessage(client, guildId, channelId, messageId);
    if (message instanceof Message) {
        try {
            await message.delete();
            return true;
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotDeleteMessage', { message: messageId }));
    return false;
}

export async function createChannel(client: typeof DiscordBot, guildId: string, name: string,
    type: ChannelType.GuildCategory | ChannelType.GuildText): Promise<CategoryChannel | TextChannel | undefined> {
    const guild = await getGuild(client, guildId);

    if (guild instanceof Guild) {
        try {
            const channel = await guild.channels.create({
                name: name,
                type: type,
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.SendMessages]
                }]
            });

            if (type === ChannelType.GuildCategory) {
                return channel as CategoryChannel;
            } else if (type === ChannelType.GuildText) {
                return channel as TextChannel;
            }
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotCreateChannel', { name: name }));
    return undefined;
}

export async function deleteChannel(client: typeof DiscordBot, guildId: string, channel: string,
    isChannelId: boolean = true): Promise<boolean> {
    const ch = await getChannel(client, guildId, channel, isChannelId);
    if (ch) {
        try {
            await ch.delete();
            return true;
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotDeleteChannel', { channel: channel }));
    return false;
}

export async function clearTextChannel(client: typeof DiscordBot, guildId: string, channelId: string,
    numberOfMessages: number): Promise<boolean> {
    const channel = await getTextChannel(client, guildId, channelId);

    if (channel instanceof TextChannel) {
        try {
            const messages = await channel.messages.fetch({ limit: numberOfMessages });
            await channel.bulkDelete(messages, true);
            return true;
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotPerformBulkDelete', { channel: channelId }));
    return false;
}

export function getDiscordFormattedDate(unixtime: string): string {
    return `<t:${unixtime}:d>`;
}