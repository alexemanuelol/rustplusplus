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

import { guildInstanceManager as gim, localeManager as lm, credentialsManager as cm } from '../../index';
import {
    GuildInstance, ServerInfo, SmartSwitchConfig, SmartSwitchConfigAutoSetting, VoiceGenders
} from '../managers/guildInstanceManager';
import * as types from '../utils/types';
import * as utils from '../utils/utils';
import { Languages, LanguageDiscordEmoji } from '../managers/LocaleManager';
import { Credentials } from '../managers/credentialsManager';
import { DiscordManager } from '../managers/discordManager';

export const StringSelectMenuLimits = {
    CustomId: 100,
    Placeholder: 150,
    MaxOptions: 25,
    OptionLabel: 100,
    OptionValue: 100,
    OptionDescription: 100,
}


/**
 * SelectMenu help functions
 */

export function getStringSelectMenu(options: discordjs.StringSelectMenuComponentData):
    discordjs.StringSelectMenuBuilder {
    const fn = `[getStringSelectMenu]`;
    const selectMenu = new discordjs.StringSelectMenuBuilder();

    if ('customId' in options && options.customId) {
        if (options.customId.length > StringSelectMenuLimits.CustomId) {
            throw new Error(`${fn} CustomId exceed limit ${StringSelectMenuLimits.CustomId}, actual: ` +
                `${options.customId.length}. CustomId: '${options.customId}'`);
        }
        selectMenu.setCustomId(options.customId);
    }

    if ('disabled' in options && options.disabled) {
        selectMenu.setDisabled(options.disabled);
    }

    if ('maxValues' in options && options.maxValues) {
        selectMenu.setMaxValues(Math.min(options.maxValues, StringSelectMenuLimits.MaxOptions));
    }

    if ('minValues' in options && options.minValues) {
        selectMenu.setMinValues(Math.min(options.minValues, StringSelectMenuLimits.MaxOptions));
    }

    if ('placeholder' in options && options.placeholder) {
        selectMenu.setPlaceholder(utils.truncate(options.placeholder, StringSelectMenuLimits.Placeholder));
    }

    if ('options' in options && options.options.length > 0) {
        const truncatedOptions = options.options.slice(0, StringSelectMenuLimits.MaxOptions).map(option => {
            const selectOption = new discordjs.StringSelectMenuOptionBuilder()
                .setLabel(utils.truncate(option.label, StringSelectMenuLimits.OptionLabel))
                .setValue(utils.truncate(option.value, StringSelectMenuLimits.OptionValue));

            if (option.default) {
                selectOption.setDefault(option.default);
            }

            if (option.description) {
                selectOption.setDescription(utils.truncate(option.description,
                    StringSelectMenuLimits.OptionDescription));
            }

            if (option.emoji) {
                selectOption.setEmoji(option.emoji);
            }

            return selectOption;
        });

        selectMenu.setOptions(truncatedOptions);
    }

    return selectMenu;
}


/**
 * Guild based selectMenus
 */

export function getSmartSwitchSelectMenu(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId):
    discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const smartSwitchConfig = serverInfo.smartSwitchConfigMap[entityId] as SmartSwitchConfig;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const autoSettingLabel = lm.getIntl(language, 'autoSettingLabel');
    const autoSettingMap = {
        [SmartSwitchConfigAutoSetting.Off]: [
            lm.getIntl(language, 'autoSettingOffLabel'),
            lm.getIntl(language, 'autoSettingOffDesc')],
        [SmartSwitchConfigAutoSetting.AutoDay]: [
            lm.getIntl(language, 'autoSettingAutoDayLabel'),
            lm.getIntl(language, 'autoSettingAutoDayDesc')],
        [SmartSwitchConfigAutoSetting.AutoNight]: [
            lm.getIntl(language, 'autoSettingAutoNightLabel'),
            lm.getIntl(language, 'autoSettingAutoNightDesc')],
        [SmartSwitchConfigAutoSetting.AutoOn]: [
            lm.getIntl(language, 'autoSettingAutoOnLabel'),
            lm.getIntl(language, 'autoSettingAutoOnDesc')],
        [SmartSwitchConfigAutoSetting.AutoOff]: [
            lm.getIntl(language, 'autoSettingAutoOffLabel'),
            lm.getIntl(language, 'autoSettingAutoOffDesc')],
        [SmartSwitchConfigAutoSetting.AutoOnProximity]: [
            lm.getIntl(language, 'autoSettingAutoOnProximityLabel'),
            lm.getIntl(language, 'autoSettingAutoOnProximityDesc')],
        [SmartSwitchConfigAutoSetting.AutoOffProximity]: [
            lm.getIntl(language, 'autoSettingAutoOffProximityLabel'),
            lm.getIntl(language, 'autoSettingAutoOffProximityDesc')],
        [SmartSwitchConfigAutoSetting.AutoOnAnyOnline]: [
            lm.getIntl(language, 'autoSettingAutoOnAnyOnlineLabel'),
            lm.getIntl(language, 'autoSettingAutoOnAnyOnlineDesc')],
        [SmartSwitchConfigAutoSetting.AutoOffAnyOnline]: [
            lm.getIntl(language, 'autoSettingAutoOffAnyOnlineLabel'),
            lm.getIntl(language, 'autoSettingAutoOffAnyOnlineDesc')]
    };

    const autoSetting = autoSettingMap[smartSwitchConfig.autoSetting];
    const autoSettingString = `${autoSettingLabel}${autoSetting[0]}`;

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: `AutoSetting${identifier}`,
            placeholder: `${autoSettingString}`,
            options: [
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.Off][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.Off][1],
                    value: `${SmartSwitchConfigAutoSetting.Off}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoDay][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoDay][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoDay}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoNight][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoNight][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoNight}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOn][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOn][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOn}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOff][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOff][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOff}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOnProximity][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOnProximity][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOnProximity}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOffProximity][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOffProximity][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOffProximity}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOnAnyOnline][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOnAnyOnline][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOnAnyOnline}`
                },
                {
                    label: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOffAnyOnline][0],
                    description: autoSettingMap[SmartSwitchConfigAutoSetting.AutoOffAnyOnline][1],
                    value: `${SmartSwitchConfigAutoSetting.AutoOffAnyOnline}`
                }],
            type: discordjs.ComponentType.StringSelect
        })
    );
}

export async function getRequesterSteamIdSelectMenu(dm: DiscordManager, guildId: types.GuildId,
    serverId: types.ServerId): Promise<discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const server = gInstance.serverInfoMap[serverId] as ServerInfo;
    const identifier = JSON.stringify({ 'serverId': serverId });
    const serverPairingDataMap = gInstance.pairingDataMap[serverId];

    const options: discordjs.SelectMenuComponentOptionData[] = [];
    options.push({
        label: lm.getIntl(language, 'noneSelected'),
        description: lm.getIntl(language, 'requesterSteamIdNoneOptionDesc'),
        value: 'none',
        emoji: '❌'
    });

    for (const [steamId, pairingData] of Object.entries(serverPairingDataMap)) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        const member = await dm.getMember(guildId, credentials.discordUserId);
        const userName = member ? member.user.username : lm.getIntl(language, 'unknown');
        options.push({
            label: steamId,
            description: lm.getIntl(language, 'requesterSteamIdOptionDesc', { user: userName }),
            value: steamId,
            emoji: pairingData.valid ? '✅' : '❌'
        });
    }

    let name = lm.getIntl(language, 'noneSelected');
    if (server.requesterSteamId !== null) {
        const credentials = cm.getCredentials(server.requesterSteamId);
        name = server.requesterSteamId;
        if (credentials) {
            const member = await dm.getMember(guildId, credentials.discordUserId);
            const userName = member ? ` (${member.user.username})` : '';
            name += userName;
        }
    }

    const mainRequesterValid = server.requesterSteamId !== null &&
        Object.hasOwn(serverPairingDataMap, server.requesterSteamId) &&
        serverPairingDataMap[server.requesterSteamId].valid;
    const placeholder = `${mainRequesterValid ? '✅' : '❌'} ${name}`;

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: `RequesterSteamId${identifier}`,
            disabled: Object.keys(serverPairingDataMap).length === 0 ? true : false,
            placeholder: placeholder,
            options: options,
            type: discordjs.ComponentType.StringSelect
        })
    );
}


/**
 * Settings based selectMenus
 */

export function getSettingLanguageSelectMenu(guildId: types.GuildId):
    discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const currentLanguageCode = gInstance.generalSettings.language;

    const options: discordjs.SelectMenuComponentOptionData[] = [];
    for (const languageCode of Object.values(Languages)) {
        options.push({
            label: lm.getIntl(currentLanguageCode, `languageCode-${languageCode}`),
            description: lm.getIntl(currentLanguageCode, 'settingLanguageOptionDesc', {
                language: lm.getIntl(currentLanguageCode, `languageCode-${languageCode}`)
            }),
            value: languageCode,
            emoji: LanguageDiscordEmoji[languageCode]
        });
    }

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: 'GeneralSetting-language',
            placeholder: `${LanguageDiscordEmoji[currentLanguageCode]} ` +
                `${lm.getIntl(currentLanguageCode, `languageCode-${currentLanguageCode}`)}`,
            options: options,
            type: discordjs.ComponentType.StringSelect
        })
    );
}

export function getSettingVoiceGenderSelectMenu(guildId: types.GuildId):
    discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const voiceGender = gInstance.generalSettings.voiceGender;

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: 'GeneralSetting-voiceGender',
            placeholder: voiceGender === VoiceGenders.MALE ? `👨 ${lm.getIntl(language, 'male')}` :
                `👩 ${lm.getIntl(language, 'female')}`,
            options: [
                {
                    label: `👨 ${lm.getIntl(language, 'male')}`,
                    description: lm.getIntl(language, 'settingVoiceGenderOptionDesc', {
                        gender: lm.getIntl(language, 'male')
                    }),
                    value: VoiceGenders.MALE
                },
                {
                    label: `👩 ${lm.getIntl(language, 'female')}`,
                    description: lm.getIntl(language, 'settingVoiceGenderOptionDesc', {
                        gender: lm.getIntl(language, 'female')
                    }),
                    value: VoiceGenders.FEMALE
                }
            ],
            type: discordjs.ComponentType.StringSelect
        })
    );
}

export function getSettingInGameChatMessageDelaySelectMenu(guildId: types.GuildId):
    discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const commandResponseDelay = gInstance.generalSettings.inGameChatMessageDelay;

    const options: discordjs.SelectMenuComponentOptionData[] = [];
    for (let i = 0; i <= 10; i++) {
        options.push({
            label: lm.getIntl(language, 'xSeconds', { seconds: `${i}` }),
            description: lm.getIntl(language, 'settingInGameChatMessageDelayOptionDesc', { seconds: `${i}` }),
            value: `${i}`
        });
    }

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: 'GeneralSetting-inGameChatMessageDelay',
            placeholder: lm.getIntl(language, 'xSeconds', { seconds: `${commandResponseDelay}` }),
            options: [...options],
            type: discordjs.ComponentType.StringSelect
        })
    );
}