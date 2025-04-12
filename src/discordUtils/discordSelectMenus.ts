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

import { guildInstanceManager as gim, localeManager as lm } from '../../index';
import {
    GuildInstance, ServerInfo, SmartSwitch, SmartSwitchAutoSetting, VoiceGenders
} from '../managers/guildInstanceManager';
import * as types from '../utils/types';
import { Languages, LanguageDiscordEmoji } from '../managers/LocaleManager';

export const StringSelectMenuLimits = {
    CustomId: 100,
    Placeholder: 150,
    MaxOptions: 25,
    OptionLabel: 100,
    OptionValue: 100,
    OptionDescription: 100,
}

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}


/**
 * SelectMenu help functions
 */

export function getStringSelectMenu(options: discordjs.StringSelectMenuComponentData):
    discordjs.StringSelectMenuBuilder {
    const funcName = `[getStringSelectMenu]`;
    const selectMenu = new discordjs.StringSelectMenuBuilder();

    if ('customId' in options && options.customId) {
        if (options.customId.length > StringSelectMenuLimits.CustomId) {
            throw new Error(`${funcName} CustomId exceed limit ${StringSelectMenuLimits.CustomId}, actual: ` +
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
        selectMenu.setPlaceholder(truncate(options.placeholder, StringSelectMenuLimits.Placeholder));
    }

    if ('options' in options && options.options.length > 0) {
        const truncatedOptions = options.options.slice(0, StringSelectMenuLimits.MaxOptions).map(option => {
            const selectOption = new discordjs.StringSelectMenuOptionBuilder()
                .setLabel(truncate(option.label, StringSelectMenuLimits.OptionLabel))
                .setValue(truncate(option.value, StringSelectMenuLimits.OptionValue));

            if (option.default) {
                selectOption.setDefault(option.default);
            }

            if (option.description) {
                selectOption.setDescription(truncate(option.description, StringSelectMenuLimits.OptionDescription));
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
    const smartSwitch = serverInfo.smartSwitchMap[entityId] as SmartSwitch;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const autoSettingLabel = lm.getIntl(language, 'autoSettingLabel');
    const autoSettingMap = {
        [SmartSwitchAutoSetting.Off]: [
            lm.getIntl(language, 'autoSettingOffLabel'),
            lm.getIntl(language, 'autoSettingOffDesc')],
        [SmartSwitchAutoSetting.AutoDay]: [
            lm.getIntl(language, 'autoSettingAutoDayLabel'),
            lm.getIntl(language, 'autoSettingAutoDayDesc')],
        [SmartSwitchAutoSetting.AutoNight]: [
            lm.getIntl(language, 'autoSettingAutoNightLabel'),
            lm.getIntl(language, 'autoSettingAutoNightDesc')],
        [SmartSwitchAutoSetting.AutoOn]: [
            lm.getIntl(language, 'autoSettingAutoOnLabel'),
            lm.getIntl(language, 'autoSettingAutoOnDesc')],
        [SmartSwitchAutoSetting.AutoOff]: [
            lm.getIntl(language, 'autoSettingAutoOffLabel'),
            lm.getIntl(language, 'autoSettingAutoOffDesc')],
        [SmartSwitchAutoSetting.AutoOnProximity]: [
            lm.getIntl(language, 'autoSettingAutoOnProximityLabel'),
            lm.getIntl(language, 'autoSettingAutoOnProximityDesc')],
        [SmartSwitchAutoSetting.AutoOffProximity]: [
            lm.getIntl(language, 'autoSettingAutoOffProximityLabel'),
            lm.getIntl(language, 'autoSettingAutoOffProximityDesc')],
        [SmartSwitchAutoSetting.AutoOnAnyOnline]: [
            lm.getIntl(language, 'autoSettingAutoOnAnyOnlineLabel'),
            lm.getIntl(language, 'autoSettingAutoOnAnyOnlineDesc')],
        [SmartSwitchAutoSetting.AutoOffAnyOnline]: [
            lm.getIntl(language, 'autoSettingAutoOffAnyOnlineLabel'),
            lm.getIntl(language, 'autoSettingAutoOffAnyOnlineDesc')]
    };

    const autoSetting = autoSettingMap[smartSwitch.autoSetting];
    const autoSettingString = `${autoSettingLabel}${autoSetting[0]}`;

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: `AutoSetting${identifier}`,
            placeholder: `${autoSettingString}`,
            options: [
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.Off][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.Off][1],
                    value: `${SmartSwitchAutoSetting.Off}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoDay][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoDay][1],
                    value: `${SmartSwitchAutoSetting.AutoDay}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoNight][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoNight][1],
                    value: `${SmartSwitchAutoSetting.AutoNight}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOn][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOn][1],
                    value: `${SmartSwitchAutoSetting.AutoOn}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOff][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOff][1],
                    value: `${SmartSwitchAutoSetting.AutoOff}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOnProximity][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOnProximity][1],
                    value: `${SmartSwitchAutoSetting.AutoOnProximity}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOffProximity][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOffProximity][1],
                    value: `${SmartSwitchAutoSetting.AutoOffProximity}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOnAnyOnline][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOnAnyOnline][1],
                    value: `${SmartSwitchAutoSetting.AutoOnAnyOnline}`
                },
                {
                    label: autoSettingMap[SmartSwitchAutoSetting.AutoOffAnyOnline][0],
                    description: autoSettingMap[SmartSwitchAutoSetting.AutoOffAnyOnline][1],
                    value: `${SmartSwitchAutoSetting.AutoOffAnyOnline}`
                }],
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

export function getSettingInGameChatCommandResponseDelaySelectMenu(guildId: types.GuildId):
    discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const commandResponseDelay = gInstance.generalSettings.inGameChatCommandResponseDelay;

    const options: discordjs.SelectMenuComponentOptionData[] = [];
    for (let i = 0; i <= 10; i++) {
        options.push({
            label: lm.getIntl(language, 'xSeconds', { seconds: `${i}` }),
            description: lm.getIntl(language, 'settingInGameChatCommandResponseDelayOptionDesc', { seconds: `${i}` }),
            value: `${i}`
        });
    }

    return new discordjs.ActionRowBuilder<discordjs.StringSelectMenuBuilder>().addComponents(
        getStringSelectMenu({
            customId: 'GeneralSetting-inGameChatCommandResponseDelay',
            placeholder: lm.getIntl(language, 'xSeconds', { seconds: `${commandResponseDelay}` }),
            options: [...options],
            type: discordjs.ComponentType.StringSelect
        })
    );
}