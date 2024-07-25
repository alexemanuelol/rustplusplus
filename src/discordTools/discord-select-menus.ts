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

import { StringSelectMenuBuilder, ActionRowBuilder, SelectMenuComponentOptionData } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

import * as guildInstance from '../util/guild-instance';
import { localeManager as lm } from "../../index";
import { languageCodes } from "../util/languages";
import * as Constants from '../util/constants';


export interface SelectMenuOptions {
    customId?: string;
    placeholder?: string;
    options?: SelectMenuComponentOptionData[];
    disabled?: boolean;
}

export function getSelectMenu(guildId: string, options: SelectMenuOptions = {}): StringSelectMenuBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const selectMenu = new StringSelectMenuBuilder();

    if (options.hasOwnProperty('customId') && options.customId !== undefined) {
        selectMenu.setCustomId(options.customId);
    }

    if (options.hasOwnProperty('placeholder') && options.placeholder !== undefined) {
        selectMenu.setPlaceholder(options.placeholder);
    }

    if (options.hasOwnProperty('options') && options.options !== undefined) {
        for (const option of options.options) {
            if (option.description === undefined) {
                option.description = lm.getIntl(instance.generalSettings.language, 'empty');
                continue;
            }
            option.description = option.description.substring(0, Constants.SELECT_MENU_MAX_DESCRIPTION_CHARACTERS);
        }
        selectMenu.setOptions(options.options);
    }

    if (options.hasOwnProperty('disabled') && options.disabled !== undefined) {
        selectMenu.setDisabled(options.disabled);
    }

    return selectMenu;
}

export function getLanguageSelectMenu(guildId: string, language: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const languageFiles: string[] = fs.readdirSync(path.join(__dirname, '..', 'languages'))
        .filter((file: string) => file.endsWith('.json'));

    const options: SelectMenuComponentOptionData[] = [];
    for (const languageFile of languageFiles) {
        const languageCode = languageFile.replace('.json', '');
        let lang = Object.keys(languageCodes).find(e => languageCodes[e] === languageCode);
        if (!lang) lang = lm.getIntl(instance.generalSettings.language, 'unknown');
        options.push({
            label: `${lang} (${languageCode})`,
            description: lm.getIntl(instance.generalSettings.language, 'setBotLanguage', {
                language: `${lang} (${languageCode})`
            }),
            value: languageCode
        });
    }

    let currentLanguage = Object.keys(languageCodes).find(e => languageCodes[e] === language);
    if (!currentLanguage) currentLanguage = lm.getIntl(instance.generalSettings.language, 'unknown');

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: 'language',
            placeholder: `${currentLanguage} (${language})`,
            options: options
        })
    );
}

export function getPrefixSelectMenu(guildId: string, prefix: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: 'Prefix',
            placeholder: lm.getIntl(language, 'currentPrefixPlaceholder', { prefix: prefix }),
            options: [
                { label: '!', description: lm.getIntl(language, 'exclamationMark'), value: '!' },
                { label: '?', description: lm.getIntl(language, 'questionMark'), value: '?' },
                { label: '.', description: lm.getIntl(language, 'dot'), value: '.' },
                { label: ':', description: lm.getIntl(language, 'colon'), value: ':' },
                { label: ',', description: lm.getIntl(language, 'comma'), value: ',' },
                { label: ';', description: lm.getIntl(language, 'semicolon'), value: ';' },
                { label: '-', description: lm.getIntl(language, 'dash'), value: '-' },
                { label: '_', description: lm.getIntl(language, 'underscore'), value: '_' },
                { label: '=', description: lm.getIntl(language, 'equalsSign'), value: '=' },
                { label: '*', description: lm.getIntl(language, 'asterisk'), value: '*' },
                { label: '@', description: lm.getIntl(language, 'atSign'), value: '@' },
                { label: '+', description: lm.getIntl(language, 'plusSign'), value: '+' },
                { label: "'", description: lm.getIntl(language, 'apostrophe'), value: "'" },
                { label: '#', description: lm.getIntl(language, 'hash'), value: '#' },
                { label: '¤', description: lm.getIntl(language, 'currencySign'), value: '¤' },
                { label: '%', description: lm.getIntl(language, 'percentSign'), value: '%' },
                { label: '&', description: lm.getIntl(language, 'ampersand'), value: '&' },
                { label: '|', description: lm.getIntl(language, 'pipe'), value: '|' },
                { label: '>', description: lm.getIntl(language, 'greaterThanSign'), value: '>' },
                { label: '<', description: lm.getIntl(language, 'lessThanSign'), value: '<' },
                { label: '~', description: lm.getIntl(language, 'tilde'), value: '~' },
                { label: '^', description: lm.getIntl(language, 'circumflex'), value: '^' },
                { label: '♥', description: lm.getIntl(language, 'heart'), value: '♥' },
                { label: '☺', description: lm.getIntl(language, 'smilyFace'), value: '☺' },
                { label: '/', description: lm.getIntl(language, 'slash'), value: '/' }]
        })
    );
}

export function getTrademarkSelectMenu(guildId: string, trademark: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: 'Trademark',
            placeholder: `${trademark === 'NOT SHOWING' ? lm.getIntl(language, 'notShowingCap') : trademark}`,
            options: [
                {
                    label: 'rustplusplus',
                    description: lm.getIntl(language, 'trademarkShownBeforeMessage', {
                        trademark: 'rustplusplus'
                    }),
                    value: 'rustplusplus'
                },
                {
                    label: 'Rust++',
                    description: lm.getIntl(language, 'trademarkShownBeforeMessage', {
                        trademark: 'Rust++'
                    }),
                    value: 'Rust++'
                },
                {
                    label: 'R++',
                    description: lm.getIntl(language, 'trademarkShownBeforeMessage', {
                        trademark: 'R++'
                    }),
                    value: 'R++'
                },
                {
                    label: 'RPP',
                    description: lm.getIntl(language, 'trademarkShownBeforeMessage', {
                        trademark: 'RPP'
                    }),
                    value: 'RPP'
                },
                {
                    label: lm.getIntl(language, 'notShowingCap'),
                    description: lm.getIntl(language, 'hideTrademark'),
                    value: 'NOT SHOWING'
                }]
        })
    );
}

export function getCommandDelaySelectMenu(guildId: string, delay: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: 'CommandDelay',
            placeholder: lm.getIntl(language, 'currentCommandDelay', { delay: delay }),
            options: [
                {
                    label: lm.getIntl(language, 'noDelayCap'),
                    description: lm.getIntl(language, 'noCommandDelay'),
                    value: '0'
                },
                {
                    label: lm.getIntl(language, 'second', { second: '1' }),
                    description: lm.getIntl(language, 'secondCommandDelay', {
                        second: lm.getIntl(language, 'one')
                    }),
                    value: '1'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '2' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'two')
                    }),
                    value: '2'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '3' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'three')
                    }),
                    value: '3'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '4' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'four')
                    }),
                    value: '4'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '5' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'five')
                    }),
                    value: '5'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '6' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'six')
                    }),
                    value: '6'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '7' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'seven')
                    }),
                    value: '7'
                },
                {
                    label: lm.getIntl(language, 'seconds', { seconds: '8' }),
                    description: lm.getIntl(language, 'secondsCommandDelay', {
                        seconds: lm.getIntl(language, 'eight')
                    }),
                    value: '8'
                }]
        })
    );
}

export function getSmartSwitchSelectMenu(guildId: string, serverId: string, entityId: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const entity = instance.serverList[serverId].switches[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const autoSetting = lm.getIntl(language, 'autoSettingCap');
    const off = lm.getIntl(language, 'offCap');
    const autoDay = lm.getIntl(language, 'autoDayCap');
    const autoNight = lm.getIntl(language, 'autoNightCap');
    const autoOn = lm.getIntl(language, 'autoOnCap');
    const autoOff = lm.getIntl(language, 'autoOffCap');
    const autoOnProximity = lm.getIntl(language, 'autoOnProximityCap');
    const autoOffProximity = lm.getIntl(language, 'autoOffProximityCap');
    const autoOnAnyOnline = lm.getIntl(language, 'autoOnAnyOnlineCap');
    const autoOffAnyOnline = lm.getIntl(language, 'autoOffAnyOnlineCap');

    let autoDayNightOnOffString = autoSetting;
    if (entity.autoDayNightOnOff === 0) autoDayNightOnOffString += off;
    else if (entity.autoDayNightOnOff === 1) autoDayNightOnOffString += autoDay;
    else if (entity.autoDayNightOnOff === 2) autoDayNightOnOffString += autoNight;
    else if (entity.autoDayNightOnOff === 3) autoDayNightOnOffString += autoOn;
    else if (entity.autoDayNightOnOff === 4) autoDayNightOnOffString += autoOff;
    else if (entity.autoDayNightOnOff === 5) autoDayNightOnOffString += autoOnProximity;
    else if (entity.autoDayNightOnOff === 6) autoDayNightOnOffString += autoOffProximity;
    else if (entity.autoDayNightOnOff === 7) autoDayNightOnOffString += autoOnAnyOnline;
    else if (entity.autoDayNightOnOff === 8) autoDayNightOnOffString += autoOffAnyOnline;

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: `AutoDayNightOnOff${identifier}`,
            placeholder: `${autoDayNightOnOffString}`,
            options: [
                { label: off, description: lm.getIntl(language, 'smartSwitchNormal'), value: '0' },
                { label: autoDay, description: lm.getIntl(language, 'smartSwitchAutoDay'), value: '1' },
                { label: autoNight, description: lm.getIntl(language, 'smartSwitchAutoNight'), value: '2' },
                { label: autoOn, description: lm.getIntl(language, 'smartSwitchAutoOn'), value: '3' },
                { label: autoOff, description: lm.getIntl(language, 'smartSwitchAutoOff'), value: '4' },
                { label: autoOnProximity, description: lm.getIntl(language, 'smartSwitchAutoOnProximity'), value: '5' },
                {
                    label: autoOffProximity, description: lm.getIntl(language, 'smartSwitchAutoOffProximity'),
                    value: '6'
                },
                { label: autoOnAnyOnline, description: lm.getIntl(language, 'smartSwitchAutoOnAnyOnline'), value: '7' },
                {
                    label: autoOffAnyOnline, description: lm.getIntl(language, 'smartSwitchAutoOffAnyOnline'),
                    value: '8'
                }]
        })
    );
}

export function getVoiceGenderSelectMenu(guildId: string, gender: string):
    ActionRowBuilder<StringSelectMenuBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        getSelectMenu(guildId, {
            customId: 'VoiceGender',
            placeholder: `${gender === 'male' ? lm.getIntl(language, 'commandsVoiceMale') :
                lm.getIntl(language, 'commandsVoiceFemale')}`,
            options: [
                {
                    label: lm.getIntl(language, 'commandsVoiceMale'),
                    description: lm.getIntl(language, 'commandsVoiceMaleDescription'),
                    value: 'male'
                },
                {
                    label: lm.getIntl(language, 'commandsVoiceFemale'),
                    description: lm.getIntl(language, 'commandsVoiceFemaleDescription'),
                    value: 'female'
                }]
        })
    );
}