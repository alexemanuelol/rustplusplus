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

import {
    localeManager as lm, guildInstanceManager as gim, config, credentialsManager as cm, rustPlusManager as rpm
} from '../../index';
import {
    GuildInstance, ServerInfo, SmartSwitch, SmartAlarm, StorageMonitor, StorageMonitorType

} from '../managers/guildInstanceManager';
import * as constants from '../utils/constants';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { Credentials } from '../managers/credentialsManager';
import { PlayerDeathBody, TeamLoginBody } from '../managers/fcmListenerManager';
import { fetchSteamProfilePicture } from '../utils/steam';

export const EmbedLimits = {
    Maximum: 6000,
    Title: 256,
    Description: 4096,
    Fields: 25,
    FieldName: 256,
    FieldValue: 1024,
    FooterText: 2048,
    AuthorName: 256,
};

export interface ColumnData {
    name: string,
    data: string[]
}

/* Convert hexadecimal color string (with #) to a number. */
export function colorHexToNumber(hex: string): number {
    return parseInt(hex.replace(/^#/, ''), 16);
}

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}


/**
 * Embed help functions
 */

export function getEmbed(options: discordjs.EmbedData): discordjs.EmbedBuilder {
    const embed = new discordjs.EmbedBuilder();

    if (options.title) embed.setTitle(truncate(options.title, EmbedLimits.Title));
    if (options.description) embed.setDescription(truncate(options.description, EmbedLimits.Description));
    if (options.url) embed.setURL(options.url);
    if (options.timestamp) embed.setTimestamp();
    if (options.color) embed.setColor(options.color);

    if (options.footer) {
        embed.setFooter({
            ...options.footer,
            text: truncate(options.footer.text, EmbedLimits.FooterText)
        });
    }

    if (options.image?.url) embed.setImage(options.image.url);
    if (options.thumbnail?.url) embed.setThumbnail(options.thumbnail.url);

    if (options.author) {
        embed.setAuthor({
            ...options.author,
            name: truncate(options.author.name, EmbedLimits.AuthorName)
        });
    }

    if (options.fields) {
        embed.setFields(...options.fields);

        const truncatedFields = options.fields.slice(0, EmbedLimits.Fields).map(field => {
            return {
                name: truncate(field.name, EmbedLimits.FieldName),
                value: truncate(field.value, EmbedLimits.FieldValue),
                inline: field.inline
            };
        });

        embed.setFields(...truncatedFields);
    }

    return embed;
}

export function getEmbedColumnFields(options: discordjs.EmbedData, columns: ColumnData[]): discordjs.EmbedBuilder {
    const funcName = '[getEmbedColumnFields]';
    if (!columns || columns.length === 0 || columns.length > 3) {
        throw new Error(`${funcName} Must provide between 1 and 3 columns.`);
    }

    const expectedColumnDataLength = columns[0]?.data.length;
    if (!columns.every(col => col.data.length === expectedColumnDataLength)) {
        throw new Error(`${funcName} All columns must have the same number of data items.`);
    }

    const embed = getEmbed(options);
    embed.setFields([]);

    let totalChars = 0;

    if (options.title) totalChars += truncate(options.title, EmbedLimits.Title).length;
    if (options.description) totalChars += truncate(options.description, EmbedLimits.Description).length;
    if (options.footer?.text) totalChars += truncate(options.footer.text, EmbedLimits.FooterText).length;
    if (options.author?.name) totalChars += truncate(options.author.name, EmbedLimits.AuthorName).length;

    const columnNames: string[] = [];
    columns.forEach((column) => {
        const columnName = truncate(column.name, EmbedLimits.FieldName);
        totalChars += columnName.length;
        columnNames.push(columnName);
    });

    const fields: discordjs.EmbedField[] = [];

    let fieldIndex = 0;
    const fieldsData: string[] = Array(columns.length).fill('');
    if (columns.length === 2) {
        fieldsData.push('\u200B');
        totalChars += '\u200B'.length * 2; /* For empty field name/value */
    }
    for (let row = 0; row < expectedColumnDataLength; row++) {
        const rowLength = columns.reduce((sum, column) => sum + column.data[row].length + '\n'.length, 0);
        if ((totalChars + rowLength) > EmbedLimits.Maximum) break;

        if (columns.some((column, index) => column.data[row].length + fieldsData[fieldIndex + index].length >
            EmbedLimits.FieldValue)) {
            totalChars += '\u200B'.length * columns.length; /* For empty field name */
            fieldIndex += columns.length + (columns.length === 2 ? 1 : 0);
            fieldsData.push(...Array(columns.length).fill(''));
            if (columns.length === 2) {
                fieldsData.push('\u200B');
                totalChars += '\u200B'.length * 2; /* For empty field name/value */
            }

            if ((totalChars + rowLength) > EmbedLimits.Maximum) break;
        }

        columns.forEach((column, index) => {
            fieldsData[fieldIndex + index] += column.data[row] + '\n';
        });

        totalChars += rowLength;
    }

    for (const [index, fieldData] of fieldsData.entries()) {
        fields.push({
            name: index < columns.length ? columnNames[index] : '\u200B',
            value: fieldData.length !== 0 ? fieldData : '\u200B',
            inline: true
        });
    };

    /* Based on number of columns, there is a max number of fields. */
    const maxFields = columns.length === 1 ? 25 : columns.length === 2 ? 23 : 24;
    embed.setFields(fields.slice(0, maxFields));

    return embed;
}


/**
 * Direct-Message based embeds
 */

export async function getCredentialsExpiredEmbed(dm: DiscordManager, steamId: types.SteamId, imageName: string):
    Promise<discordjs.EmbedBuilder> {
    const language = config.general.language;
    const credentials = cm.getCredentials(steamId) as Credentials;
    const title = lm.getIntl(language, 'embedTitleCredentialsExpired');

    const guildNames: string[] = [];
    for (const guildId of credentials.associatedGuilds) {
        const guild = await dm.getGuild(guildId);
        if (guild) guildNames.push(`[${guild.name}](https://discord.com/channels/${guild.id})`);
    }

    const parameters = {
        steamId: `${constants.GET_STEAM_PROFILE_LINK(credentials.steamId)}`,
        issueDate: discordjs.time(credentials.issueDate, 'R'),
        expireDate: discordjs.time(credentials.expireDate, 'R'),
        guilds: `${guildNames.join(', ')}`
    }

    const description = lm.getIntl(language, 'embedDescCredentialsExpired', parameters);

    return getEmbed({
        title: title,
        description: description,
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        footer: {
            text: lm.getIntl(language, 'credentialAppRequired', {
                version1: `${constants.RUSTPLUSPLUS_VERSION}`,
                version2: `${constants.RUSTPLUSPLUS_CREDENTIAL_APP_VERSION}`
            })
        },
        thumbnail: {
            url: `attachment://${imageName}`
        }
    })
}

export async function getFcmPlayerDeathEmbed(title: string, body: PlayerDeathBody): Promise<discordjs.EmbedBuilder> {
    let imgUrl = null;
    if (body.targetId !== '') imgUrl = await fetchSteamProfilePicture(body.targetId);

    // TODO! Based on targetName, change image to like boar, bear, wolf etc

    return getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: imgUrl ? imgUrl : constants.DEFAULT_SERVER_IMAGE },
        footer: { text: body.name },
        timestamp: new Date(),
        url: body.targetId !== '' ? `${constants.STEAM_PROFILES_URL}${body.targetId}` : ''
    });
}


/**
 * Slash Command based embeds
 */

export function getDefaultEmbed(dm: DiscordManager, interaction: discordjs.Interaction, imageName: string,
    title: string, description: string, parameters: { [key: string]: string } = {}): discordjs.EmbedBuilder {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    return getEmbed({
        title: lm.getIntl(language, title),
        description: lm.getIntl(language, description, parameters),
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: {
            url: `attachment://${imageName}`
        }
    })
}

export function getHelpEmbed(dm: DiscordManager, imageName: string): discordjs.EmbedBuilder {
    const title = 'rustplusplus Help';
    const description = `A NodeJS Discord Bot that uses the rustplus-ts library to utilize the power of the Rust+ ` +
        `Companion App with additional Quality-of-Life features.\n\n` +
        `→ [rustplusplus GitHub repository](${constants.RUSTPLUSPLUS_REPOSITORY_URL})\n` +
        `→ [rustplusplus Discord](${constants.DISCORD_INVITATION_URL})\n` +
        `→ [Documentation](${constants.RUSTPLUSPLUS_DOCUMENTATION_URL})\n` +
        `→ [Frequently asked questions](${constants.RUSTPLUSPLUS_FAQ_URL})\n` +
        `→ [Credentials application GitHub repository](${constants.CREDENTIALS_APP_REPOSITORY_URL})\n` +
        `→ [Latest Credential application release](${constants.CREDENTIALS_APP_LATEST_URL}) ` +
        `(${constants.RUSTPLUSPLUS_CREDENTIAL_APP_VERSION})\n\n` +
        `Made by [Alexemanuelol](${constants.AUTHOR_URL}) (alexemanuel@discord)\n` +
        `Support me on [Ko-fi](${constants.KOFI_URL}) :heart:`;

    return getEmbed({
        title: title,
        description: description,
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        footer: {
            text: `rustplusplus version: ${constants.RUSTPLUSPLUS_VERSION}`
        },
        thumbnail: {
            url: `attachment://${imageName}`
        }
    });
}

export function getRoleListEmbed(dm: DiscordManager, interaction: discordjs.Interaction, imageName: string):
    discordjs.EmbedBuilder {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const adminIds = gInstance.adminIds;
    let adminRoleNames = '';
    let adminRoleIds = '';
    for (const roleId of adminIds) {
        adminRoleNames += `<@&${roleId}>\n`;
        adminRoleIds += `${roleId}\n`;
    }
    if (adminRoleNames === '') {
        adminRoleNames = '---';
        adminRoleIds = '---';
    }

    const roleIds = gInstance.roleIds;
    let roleRoleNames = '';
    let roleRoleIds = '';
    for (const roleId of roleIds) {
        roleRoleNames += `<@&${roleId}>\n`;
        roleRoleIds += `${roleId}\n`;
    }
    if (roleRoleNames === '') {
        roleRoleNames = '---';
        roleRoleIds = '---';
    }

    const fields = [
        { name: lm.getIntl(language, 'admins'), value: adminRoleNames, inline: true },
        { name: lm.getIntl(language, 'id'), value: adminRoleIds, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: lm.getIntl(language, 'roles'), value: roleRoleNames, inline: true },
        { name: '\u200B', value: roleRoleIds, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }
    ];

    return getEmbed({
        title: lm.getIntl(language, 'embedTitleListOfRoles'),
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: {
            url: `attachment://${imageName}`
        },
        fields: fields
    })
}

export async function getCredentialsInfoEmbed(dm: DiscordManager, interaction: discordjs.Interaction,
    imageName: string): Promise<discordjs.EmbedBuilder> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const discordUserId = interaction.user.id;
    const steamIds = cm.getCredentialSteamIdsFromDiscordUserId(discordUserId);

    const fields: discordjs.EmbedField[] = [];
    for (const steamId of steamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;

        const guildNames: string[] = [];
        for (const guildId of credentials.associatedGuilds) {
            const guild = await dm.getGuild(guildId);
            if (guild) guildNames.push(`[${guild.name}](https://discord.com/channels/${guild.id})`);
        }

        const hasExpired = credentials.expireDate < (Date.now() / 1000);

        const fieldData = `${constants.GET_STEAM_PROFILE_LINK(credentials.steamId)}\n` +
            `${lm.getIntl(language, 'issuedAt', { time: discordjs.time(credentials.issueDate, 'R') })}\n` +
            `${lm.getIntl(language, 'expireAt', { time: discordjs.time(credentials.expireDate, 'R') })} ` +
            `${hasExpired ? constants.ERROR_EMOJI : ''}\n` +
            `${lm.getIntl(language, 'slashCommandDescCredentialsAddGcmAndroidId')}\n` +
            `${credentials.gcm.androidId}\n` +
            `${lm.getIntl(language, 'slashCommandDescCredentialsAddGcmSecurityToken')}\n` +
            `${credentials.gcm.securityToken}\n` +
            `${lm.getIntl(language, 'associatedGuilds')}\n` +
            guildNames.join('\n');

        fields.push({
            name: '\u200B',
            value: fieldData,
            inline: true
        });
    }

    return getEmbed({
        title: lm.getIntl(language, 'slashCommandSuccessTitleCredentialsInfo'),
        description: fields.length === 0 ? lm.getIntl(language, 'youDontHaveAnyCredentials') : '',
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: {
            url: `attachment://${imageName}`
        },
        fields: fields.slice(0, EmbedLimits.Fields)
    })
}

export function getCredentialsListEmbed(dm: DiscordManager, interaction: discordjs.Interaction,
    imageName: string): discordjs.EmbedBuilder {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const steamIds = cm.getCredentialSteamIdsFromGuildId(guildId);

    const fields: discordjs.EmbedField[] = [];
    for (const steamId of steamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;

        const hasExpired = credentials.expireDate < (Date.now() / 1000);

        const fieldData = `<@${credentials.discordUserId}>\n` +
            `${constants.GET_STEAM_PROFILE_LINK(credentials.steamId)}\n` +
            `${lm.getIntl(language, 'issuedAt', { time: discordjs.time(credentials.issueDate, 'R') })}\n` +
            `${lm.getIntl(language, 'expireAt', { time: discordjs.time(credentials.expireDate, 'R') })} ` +
            `${hasExpired ? constants.ERROR_EMOJI : ''}`;

        fields.push({
            name: '\u200B',
            value: fieldData,
            inline: true
        });
    }

    return getEmbed({
        title: lm.getIntl(language, 'slashCommandSuccessTitleCredentialsList'),
        timestamp: new Date(),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: {
            url: `attachment://${imageName}`
        },
        fields: fields.slice(0, EmbedLimits.Fields)
    })
}


/**
 * Guild based embeds
 */

export function getServerEmbed(guildId: types.GuildId, serverId: types.ServerId): discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;

    return getEmbed({
        title: serverInfo.name,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: serverInfo.desc,
        thumbnail: { url: serverInfo.img }
    });
}

export function getSmartSwitchEmbed(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId):
    discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const smartSwitch = serverInfo.smartSwitchMap[entityId] as SmartSwitch;
    const language = gInstance.generalSettings.language;

    // TODO! Make a function in rustPlusManager that returns state of switch?
    let active = false;
    const rpInstance = rpm.getInstance(guildId, serverId);
    if (rpInstance) {
        const smartSwitchLiveData = rpInstance.smartDeviceLiveDataMap[entityId];
        if (smartSwitchLiveData && smartSwitchLiveData.payload) {
            active = smartSwitchLiveData.payload.value;
        }
    }

    return getEmbed({
        title: smartSwitch.name,
        color: colorHexToNumber(active ? constants.COLOR_ACTIVE : constants.COLOR_INACTIVE),
        description: `**${lm.getIntl(language, 'id')}** \`${entityId}\``,
        thumbnail: { url: `attachment://${smartSwitch.img}` },
        footer: { text: serverInfo.name },
        fields: [{
            name: lm.getIntl(language, 'customCommand'),
            value: `\`${gInstance.generalSettings.inGameChatCommandPrefix}${smartSwitch.command}\``,
            inline: true
        }],
        timestamp: new Date()
    });
}

export function getSmartAlarmEmbed(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId,
    active: boolean): discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const smartAlarm = serverInfo.smartAlarmMap[entityId] as SmartAlarm;
    const language = gInstance.generalSettings.language;

    let description = `**${lm.getIntl(language, 'id')}** \`${entityId}\`\n`;
    description += `**${lm.getIntl(language, 'lastTrigger')}:** `;

    if (smartAlarm.lastTrigger !== null) {
        description += discordjs.time(smartAlarm.lastTrigger, 'R');
    }

    return getEmbed({
        title: smartAlarm.name,
        color: colorHexToNumber(active ? constants.COLOR_ACTIVE : constants.COLOR_DEFAULT),
        description: description,
        thumbnail: { url: `attachment://${smartAlarm.img}` },
        footer: { text: serverInfo.name },
        fields: [{
            name: lm.getIntl(language, 'message'),
            value: `\`${smartAlarm.message}\``,
            inline: true
        }, {
            name: lm.getIntl(language, 'customCommand'),
            value: `\`${gInstance.generalSettings.inGameChatCommandPrefix}${smartAlarm.command}\``,
            inline: false
        }],
        timestamp: new Date()
    });
}

export function getStorageMonitorEmbed(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId):
    discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const storageMonitor = serverInfo.storageMonitorMap[entityId] as StorageMonitor;
    const language = gInstance.generalSettings.language;

    const storageMonitorTypeMap = {
        [StorageMonitorType.Unknown]: lm.getIntl(language, 'unknown'),
        [StorageMonitorType.ToolCupboard]: lm.getIntl(language, 'toolCupboard'),
        [StorageMonitorType.VendingMachine]: lm.getIntl(language, 'vendingMachine'),
        [StorageMonitorType.LargeWoodBox]: lm.getIntl(language, 'largeWoodBox')
    }

    const title = storageMonitor.name;
    let description =
        `**${lm.getIntl(language, 'id')}** \`${entityId}\`\n` +
        `**${lm.getIntl(language, 'type')}** \`${storageMonitorTypeMap[storageMonitor.type]}\`\n`;
    let color = constants.COLOR_DEFAULT;

    const itemNames: string[] = [];
    const itemQuantities: string[] = [];

    /* eslint-disable-next-line no-constant-condition */
    if (false) { // TODO! IF storagemonitor in rustplusManager

        // TODO! Get items, capacity, expire from rustplusManager for the storagemonitor

        // TODO! If capacity === 0, add in the beginning of description, "NO POWER :zap:"

        if (storageMonitor.type !== StorageMonitorType.Unknown) {
            // TODO! If rustplusManager have the storagemonitor, get the capacity for slots
            description += `**${lm.getIntl(language, 'slots')}** `;
            const numberOfItems = 10;
            const capacity = 28;
            description += `\`(${numberOfItems}/${capacity})\`\n`
        }

        if (storageMonitor.type === StorageMonitorType.ToolCupboard) {
            /* eslint-disable-next-line prefer-const */
            let expiry = 1742647361; // temp
            description += `**${lm.getIntl(language, 'upkeep')}** `;

            if (expiry === 0) {
                color = constants.COLOR_INACTIVE;
                description += `\`${lm.getIntl(language, 'decayingCap')}\`:warning:`;
            }
            else {
                description += discordjs.time(expiry, 'R');
            }
        }

        // TODO! Loop through items and add to itemNames and itemQuantities
    }

    return getEmbedColumnFields({
        title: title,
        description: description,
        color: colorHexToNumber(color),
        thumbnail: { url: `attachment://${storageMonitor.img}` },
        footer: { text: serverInfo.name },
        timestamp: new Date()
    }, [
        { name: lm.getIntl(language, 'item'), data: itemNames },
        { name: lm.getIntl(language, 'quantity'), data: itemQuantities }
    ]);
}


/**
 * Notifications based embeds
 */

export function getFcmAlarmTriggerEmbed(guildId: types.GuildId, serverId: types.ServerId, title: string,
    message: string): discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;

    return getEmbed({
        title: title,
        description: message,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: serverInfo.img },
        footer: { text: serverInfo.name },
        timestamp: new Date()
    });
}

export function getFcmAlarmPluginTriggerEmbed(guildId: types.GuildId, serverId: types.ServerId, title: string,
    message: string): discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;

    return getEmbed({
        title: title,
        description: message,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: serverInfo.img },
        footer: { text: serverInfo.name },
        timestamp: new Date()
    });
}

export async function getFcmTeamLoginEmbed(guildId: types.GuildId, body: TeamLoginBody):
    Promise<discordjs.EmbedBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const imgUrl = await fetchSteamProfilePicture(body.targetId);

    return getEmbed({
        title: lm.getIntl(language, 'userJustConnected', { name: body.targetName }),
        color: colorHexToNumber(constants.COLOR_ACTIVE),
        thumbnail: { url: imgUrl ? imgUrl : constants.DEFAULT_SERVER_IMAGE },
        timestamp: new Date(),
        footer: { text: body.name },
        url: `${constants.STEAM_PROFILES_URL}${body.targetId}`
    });
}

export function getFcmNewsNewsEmbed(guildId: types.GuildId, title: string, message: string):
    discordjs.EmbedBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    // TODO! Use Open Graph meta tags to decide which image to use, for now use default one

    return getEmbed({
        title: `${lm.getIntl(language, 'newsCap')}: ${title}`,
        description: message,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: constants.DEFAULT_SERVER_IMAGE },
        timestamp: new Date()
    });
}