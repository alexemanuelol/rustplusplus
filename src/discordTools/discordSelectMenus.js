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
const Fs = require('fs');
const Path = require('path');

const Client = require('../../index.ts');
const Constants = require('../../dist/util/constants.js');
const Languages = require('../util/languages.js');

module.exports = {
    getSelectMenu: function (options = {}) {
        const selectMenu = new Discord.StringSelectMenuBuilder();

        if (options.hasOwnProperty('customId')) selectMenu.setCustomId(options.customId);
        if (options.hasOwnProperty('placeholder')) selectMenu.setPlaceholder(options.placeholder);
        if (options.hasOwnProperty('options')) {
            for (const option of options.options) {
                option.description = option.description.substring(0, Constants.SELECT_MENU_MAX_DESCRIPTION_CHARACTERS);
            }
            selectMenu.setOptions(options.options);
        }
        if (options.hasOwnProperty('disabled')) selectMenu.setDisabled(options.disabled);

        return selectMenu;
    },

    getLanguageSelectMenu: function (guildId, language) {
        const languageFiles = Fs.readdirSync(
            Path.join(__dirname, '..', 'languages')).filter(file => file.endsWith('.json'));

        const options = [];
        for (const language of languageFiles) {
            const langShort = language.replace('.json', '')
            let langLong = Object.keys(Languages).find(e => Languages[e] === langShort)
            if (!langLong) langLong = Client.client.intlGet(guildId, 'unknown');
            options.push({
                label: `${langLong} (${langShort})`,
                description: Client.client.intlGet(guildId, 'setBotLanguage', {
                    language: `${langLong} (${langShort})`
                }),
                value: langShort
            });
        }

        let currentLanguage = Object.keys(Languages).find(e => Languages[e] === language);
        if (!currentLanguage) currentLanguage = Client.client.intlGet(guildId, 'unknown');

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'language',
                placeholder: `${currentLanguage} (${language})`,
                options: options
            }));
    },

    getPrefixSelectMenu: function (guildId, prefix) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'Prefix',
                placeholder: Client.client.intlGet(guildId, 'currentPrefixPlaceholder', { prefix: prefix }),
                options: [
                    { label: '!', description: Client.client.intlGet(guildId, 'exclamationMark'), value: '!' },
                    { label: '?', description: Client.client.intlGet(guildId, 'questionMark'), value: '?' },
                    { label: '.', description: Client.client.intlGet(guildId, 'dot'), value: '.' },
                    { label: ':', description: Client.client.intlGet(guildId, 'colon'), value: ':' },
                    { label: ',', description: Client.client.intlGet(guildId, 'comma'), value: ',' },
                    { label: ';', description: Client.client.intlGet(guildId, 'semicolon'), value: ';' },
                    { label: '-', description: Client.client.intlGet(guildId, 'dash'), value: '-' },
                    { label: '_', description: Client.client.intlGet(guildId, 'underscore'), value: '_' },
                    { label: '=', description: Client.client.intlGet(guildId, 'equalsSign'), value: '=' },
                    { label: '*', description: Client.client.intlGet(guildId, 'asterisk'), value: '*' },
                    { label: '@', description: Client.client.intlGet(guildId, 'atSign'), value: '@' },
                    { label: '+', description: Client.client.intlGet(guildId, 'plusSign'), value: '+' },
                    { label: "'", description: Client.client.intlGet(guildId, 'apostrophe'), value: "'" },
                    { label: '#', description: Client.client.intlGet(guildId, 'hash'), value: '#' },
                    { label: '¤', description: Client.client.intlGet(guildId, 'currencySign'), value: '¤' },
                    { label: '%', description: Client.client.intlGet(guildId, 'percentSign'), value: '%' },
                    { label: '&', description: Client.client.intlGet(guildId, 'ampersand'), value: '&' },
                    { label: '|', description: Client.client.intlGet(guildId, 'pipe'), value: '|' },
                    { label: '>', description: Client.client.intlGet(guildId, 'greaterThanSign'), value: '>' },
                    { label: '<', description: Client.client.intlGet(guildId, 'lessThanSign'), value: '<' },
                    { label: '~', description: Client.client.intlGet(guildId, 'tilde'), value: '~' },
                    { label: '^', description: Client.client.intlGet(guildId, 'circumflex'), value: '^' },
                    { label: '♥', description: Client.client.intlGet(guildId, 'heart'), value: '♥' },
                    { label: '☺', description: Client.client.intlGet(guildId, 'smilyFace'), value: '☺' },
                    { label: '/', description: Client.client.intlGet(guildId, 'slash'), value: '/' }]
            }));
    },

    getTrademarkSelectMenu: function (guildId, trademark) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'Trademark',
                placeholder: `${trademark === 'NOT SHOWING' ?
                    Client.client.intlGet(guildId, 'notShowingCap') : trademark}`,
                options: [
                    {
                        label: 'rustplusplus',
                        description: Client.client.intlGet(guildId, 'trademarkShownBeforeMessage', {
                            trademark: 'rustplusplus'
                        }),
                        value: 'rustplusplus'
                    },
                    {
                        label: 'Rust++',
                        description: Client.client.intlGet(guildId, 'trademarkShownBeforeMessage', {
                            trademark: 'Rust++'
                        }),
                        value: 'Rust++'
                    },
                    {
                        label: 'R++',
                        description: Client.client.intlGet(guildId, 'trademarkShownBeforeMessage', {
                            trademark: 'R++'
                        }),
                        value: 'R++'
                    },
                    {
                        label: 'RPP',
                        description: Client.client.intlGet(guildId, 'trademarkShownBeforeMessage', {
                            trademark: 'RPP'
                        }),
                        value: 'RPP'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'notShowingCap'),
                        description: Client.client.intlGet(guildId, 'hideTrademark'),
                        value: 'NOT SHOWING'
                    }]
            }));
    },

    getCommandDelaySelectMenu: function (guildId, delay) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'CommandDelay',
                placeholder: Client.client.intlGet(guildId, 'currentCommandDelay', { delay: delay }),
                options: [
                    {
                        label: Client.client.intlGet(guildId, 'noDelayCap'),
                        description: Client.client.intlGet(guildId, 'noCommandDelay'),
                        value: '0'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'second', { second: '1' }),
                        description: Client.client.intlGet(guildId, 'secondCommandDelay', {
                            second: Client.client.intlGet(guildId, 'one')
                        }),
                        value: '1'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '2' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'two')
                        }),
                        value: '2'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '3' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'three')
                        }),
                        value: '3'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '4' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'four')
                        }),
                        value: '4'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '5' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'five')
                        }),
                        value: '5'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '6' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'six')
                        }),
                        value: '6'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '7' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'seven')
                        }),
                        value: '7'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '8' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', {
                            seconds: Client.client.intlGet(guildId, 'eight')
                        }),
                        value: '8'
                    }]
            }));
    },

    getSmartSwitchSelectMenu: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

        const autoSetting = Client.client.intlGet(guildId, 'autoSettingCap');
        const off = Client.client.intlGet(guildId, 'offCap');
        const autoDay = Client.client.intlGet(guildId, 'autoDayCap');
        const autoNight = Client.client.intlGet(guildId, 'autoNightCap');
        const autoOn = Client.client.intlGet(guildId, 'autoOnCap');
        const autoOff = Client.client.intlGet(guildId, 'autoOffCap');
        const autoOnProximity = Client.client.intlGet(guildId, 'autoOnProximityCap');
        const autoOffProximity = Client.client.intlGet(guildId, 'autoOffProximityCap');
        const autoOnAnyOnline = Client.client.intlGet(guildId, 'autoOnAnyOnlineCap');
        const autoOffAnyOnline = Client.client.intlGet(guildId, 'autoOffAnyOnlineCap');

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

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: `AutoDayNightOnOff${identifier}`,
                placeholder: `${autoDayNightOnOffString}`,
                options: [
                    {
                        label: off,
                        description: Client.client.intlGet(guildId, 'smartSwitchNormal'),
                        value: '0'
                    },
                    {
                        label: autoDay,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoDay'),
                        value: '1'
                    },
                    {
                        label: autoNight,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoNight'),
                        value: '2'
                    },
                    {
                        label: autoOn,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOn'),
                        value: '3'
                    },
                    {
                        label: autoOff,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOff'),
                        value: '4'
                    },
                    {
                        label: autoOnProximity,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOnProximity'),
                        value: '5'
                    },
                    {
                        label: autoOffProximity,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOffProximity'),
                        value: '6'
                    },
                    {
                        label: autoOnAnyOnline,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOnAnyOnline'),
                        value: '7'
                    },
                    {
                        label: autoOffAnyOnline,
                        description: Client.client.intlGet(guildId, 'smartSwitchAutoOffAnyOnline'),
                        value: '8'
                    }]
            }));
    },

    getVoiceGenderSelectMenu: function (guildId, gender) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'VoiceGender',
                placeholder: `${gender === 'male' ?
                    Client.client.intlGet(guildId, 'commandsVoiceMale') :
                    Client.client.intlGet(guildId, 'commandsVoiceFemale')}`,
                options: [
                    {
                        label: Client.client.intlGet(guildId, 'commandsVoiceMale'),
                        description: Client.client.intlGet(guildId, 'commandsVoiceMaleDescription'),
                        value: 'male'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'commandsVoiceFemale'),
                        description: Client.client.intlGet(guildId, 'commandsVoiceFemaleDescription'),
                        value: 'female'
                    }]
            }));
    },
}