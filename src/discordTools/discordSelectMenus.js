const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const Client = require('../../index.ts');
const Languages = require('../util/languages.js');

module.exports = {
    getSelectMenu: function (options = {}) {
        const selectMenu = new Discord.SelectMenuBuilder();

        if (options.customId) selectMenu.setCustomId(options.customId);
        if (options.placeholder) selectMenu.setPlaceholder(options.placeholder);
        if (options.options) selectMenu.setOptions(options.options);
        if (options.disabled) selectMenu.setDisabled(options.disabled);

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
                placeholder: `${trademark}`,
                options: [
                    {
                        label: 'rustPlusPlus',
                        description: Client.client.intlGet(guildId, 'trademarkShownBeforeMessage', {
                            trademark: 'rustPlusPlus'
                        }),
                        value: 'rustPlusPlus'
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
                        description: Client.client.intlGet(guildId, 'secondCommandDelay', { second: 'One' }),
                        value: '1'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '2' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Two' }),
                        value: '2'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '3' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Three' }),
                        value: '3'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '4' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Four' }),
                        value: '4'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '5' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Five' }),
                        value: '5'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '6' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Six' }),
                        value: '6'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '7' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Seven' }),
                        value: '7'
                    },
                    {
                        label: Client.client.intlGet(guildId, 'seconds', { seconds: '8' }),
                        description: Client.client.intlGet(guildId, 'secondsCommandDelay', { seconds: 'Eight' }),
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

        let autoDayNightString = autoSetting;
        if (entity.autoDayNight === 0) autoDayNightString += off;
        else if (entity.autoDayNight === 1) autoDayNightString += autoDay;
        else if (entity.autoDayNight === 2) autoDayNightString += autoNight;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: `AutoDayNight${identifier}`,
                placeholder: `${autoDayNightString}`,
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
                    }]
            }));
    },
}