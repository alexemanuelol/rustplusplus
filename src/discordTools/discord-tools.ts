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

import { log, client } from '../../index';
import { localeManager as lm } from '../../index';
const Config = require('../../config');

export async function getGuild(guildId: string): Promise<discordjs.Guild | undefined> {
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

export async function getRole(guildId: string, role: string, isRoleId: boolean = true):
    Promise<discordjs.Role | undefined> {
    const guild = await getGuild(guildId);

    if (guild instanceof discordjs.Guild) {
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

export async function getMember(guildId: string, member: string, isMemberId: boolean = true):
    Promise<discordjs.GuildMember | undefined> {
    const guild = await getGuild(guildId);

    if (guild instanceof discordjs.Guild) {
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

async function getChannel(guildId: string, channel: string, isChannelId: boolean = true):
    Promise<discordjs.GuildBasedChannel | undefined> {
    const guild = await getGuild(guildId);

    if (guild instanceof discordjs.Guild) {
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

export async function getTextChannel(guildId: string, channel: string,
    isChannelId: boolean = true): Promise<discordjs.TextChannel | undefined> {
    const ch = await getChannel(guildId, channel, isChannelId);
    if (ch && ch.type === discordjs.ChannelType.GuildText) {
        return ch as discordjs.TextChannel;
    }
    return undefined;
}

export async function getCategory(guildId: string, category: string,
    isCategoryId: boolean = true): Promise<discordjs.CategoryChannel | undefined> {
    const categoryChannel = await getChannel(guildId, category, isCategoryId);
    if (categoryChannel && categoryChannel.type === discordjs.ChannelType.GuildCategory) {
        return categoryChannel as discordjs.CategoryChannel;
    }
    return undefined;
}

export async function getMessage(guildId: string, channelId: string, messageId: string):
    Promise<discordjs.Message | undefined> {
    const guild = await getGuild(guildId);

    if (guild instanceof discordjs.Guild) {
        const channel = await getTextChannel(guildId, channelId);

        if (channel instanceof discordjs.TextChannel) {
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

export async function deleteMessage(guildId: string, channelId: string, messageId: string): Promise<boolean> {
    const message = await getMessage(guildId, channelId, messageId);
    if (message instanceof discordjs.Message) {
        try {
            await message.delete();
            return true;
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotDeleteMessage', { message: messageId }));
    return false;
}

export async function createChannel(guildId: string, name: string,
    type: discordjs.ChannelType.GuildCategory | discordjs.ChannelType.GuildText):
    Promise<discordjs.CategoryChannel | discordjs.TextChannel | undefined> {
    const guild = await getGuild(guildId);

    if (guild instanceof discordjs.Guild) {
        try {
            const channel = await guild.channels.create({
                name: name,
                type: type,
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [discordjs.PermissionFlagsBits.SendMessages]
                }]
            });

            if (type === discordjs.ChannelType.GuildCategory) {
                return channel as discordjs.CategoryChannel;
            } else if (type === discordjs.ChannelType.GuildText) {
                return channel as discordjs.TextChannel;
            }
        }
        catch (e) { }
    }
    log.error(lm.getIntl(Config.general.language, 'couldNotCreateChannel', { name: name }));
    return undefined;
}

export async function deleteChannel(guildId: string, channel: string,
    isChannelId: boolean = true): Promise<boolean> {
    const ch = await getChannel(guildId, channel, isChannelId);
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

export async function clearTextChannel(guildId: string, channelId: string,
    numberOfMessages: number): Promise<boolean> {
    const channel = await getTextChannel(guildId, channelId);

    if (channel instanceof discordjs.TextChannel) {
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

/* Currently only used for validatePermissions function. */
export async function interactionReply(interaction: discordjs.Interaction,
    content: discordjs.InteractionReplyOptions): Promise<boolean> {
    try {
        if (interaction.isCommand()) {
            const commandInteraction = interaction as discordjs.CommandInteraction;
            await commandInteraction.reply(content);
            return true;
        }
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'interactionReplyFailed', { error: e }));
    }

    return false;
}

/* Currently only used for application commands. */
export async function interactionEditReply(interaction: discordjs.Interaction, content: discordjs.InteractionEditReplyOptions): Promise<boolean> {
    try {
        if (interaction.isCommand()) {
            const commandInteraction = interaction as discordjs.CommandInteraction;
            await commandInteraction.editReply(content);
            return true;
        }
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'interactionEditReplyFailed', { error: e }));
    }

    return false;
}

/* Currently only used for button and selectMenu interactions. */
export async function interactionUpdate(interaction: discordjs.Interaction, content: discordjs.InteractionUpdateOptions): Promise<boolean> {
    try {
        if (interaction.isButton()) {
            const buttonInteraction = interaction as discordjs.ButtonInteraction;
            await buttonInteraction.update(content);
        }
        else if (interaction.isStringSelectMenu()) {
            const stringSelectMenuInteraction = interaction as discordjs.StringSelectMenuInteraction;
            await stringSelectMenuInteraction.update(content);
        }
        return true;
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'interactionUpdateFailed', { error: e }));
    }

    return false;
}

/* Used to create new messages. */
export async function messageSend(medium: discordjs.TextChannel | discordjs.GuildMember,
    content: discordjs.MessageCreateOptions): Promise<discordjs.Message | undefined> {
    try {
        return await medium.send(content);
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'messageSendFailed', { error: e }));
    }

    return undefined;
}

/* Used for prefix commands from discord (commands channel). */
export async function messageReply(message: discordjs.Message, content: discordjs.MessageReplyOptions):
    Promise<discordjs.Message | undefined> {
    try {
        return await message.reply(content);
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'messageReplyFailed', { error: e }));
    }

    return undefined;
}

/* If a message already exist, you use this function. */
export async function messageEdit(message: discordjs.Message, content: discordjs.MessageEditOptions):
    Promise<discordjs.Message | undefined> {
    try {
        return await message.edit(content);
    }
    catch (e) {
        log.error(lm.getIntl(Config.general.language, 'messageEditFailed', { error: e }));
    }

    return undefined;
}

/* Only used for messages/interactions to a guild text channel message, not member PM. */
export async function sendUpdateMessage(guildId: string, content: discordjs.MessageCreateOptions |
    discordjs.MessageEditOptions, channelId: string | null, messageId: string | null, interaction: discordjs.Interaction | null = null):
    Promise<discordjs.Message | undefined> {
    if (interaction !== null) {
        await interactionUpdate(interaction, content as discordjs.InteractionUpdateOptions);
        return undefined;
    }

    if (channelId === null) {
        return undefined;
    }

    const message = messageId !== null ? await getMessage(guildId, channelId, messageId) : undefined;
    if (message !== undefined) {
        /* Message already exist, so update it. */
        return await messageEdit(message, content as discordjs.MessageEditOptions);
    }
    else {
        /* Message does not exist, so create it. */
        const channel = await getTextChannel(guildId, channelId);

        if (channel instanceof discordjs.TextChannel) {
            return await messageSend(channel, content as discordjs.MessageCreateOptions);
        }
        else {
            log.error(lm.getIntl(Config.general.language, 'couldNotGetChannelWithId', { id: channelId }));
            return undefined;
        }
    }
}