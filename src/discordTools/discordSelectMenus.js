const Discord = require('discord.js');

const Client = require('../../index.ts');

module.exports = {
    getSelectMenu: function (options = {}) {
        const selectMenu = new Discord.SelectMenuBuilder();

        if (options.customId) selectMenu.setCustomId(options.customId);
        if (options.placeholder) selectMenu.setPlaceholder(options.placeholder);
        if (options.options) selectMenu.setOptions(options.options);
        if (options.disabled) selectMenu.setDisabled(options.disabled);

        return selectMenu;
    },

    getPrefixSelectMenu: function (prefix) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'Prefix',
                placeholder: `Current Prefix: ${prefix}`,
                options: [
                    { label: '!', description: 'Exlamation Mark', value: '!' },
                    { label: '/', description: 'Slash', value: '/' },
                    { label: '.', description: 'Dot', value: '.' }]
            }));
    },

    getTrademarkSelectMenu: function (trademark) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'Trademark',
                placeholder: `${trademark}`,
                options: [
                    {
                        label: 'rustPlusPlus',
                        description: `rustPlusPlus will be shown before messages.`,
                        value: 'rustPlusPlus'
                    },
                    {
                        label: 'Rust++',
                        description: `Rust++ will be shown before messages.`,
                        value: 'Rust++'
                    },
                    {
                        label: 'NOT SHOWING',
                        description: 'Hide trademark.',
                        value: 'NOT SHOWING'
                    }]
            }));
    },

    getCommandDelaySelectMenu: function (delay) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: 'CommandDelay',
                placeholder: `Current Command Delay: ${delay} seconds.`,
                options: [
                    { label: 'NO DELAY', description: 'No command delay.', value: '0' },
                    { label: '1 second', description: 'One second command delay.', value: '1' },
                    { label: '2 seconds', description: 'Two seconds command delay.', value: '2' },
                    { label: '3 seconds', description: 'Three seconds command delay.', value: '3' },
                    { label: '4 seconds', description: 'Four seconds command delay.', value: '4' },
                    { label: '5 seconds', description: 'Five seconds command delay.', value: '5' },
                    { label: '6 seconds', description: 'Six seconds command delay.', value: '6' },
                    { label: '7 seconds', description: 'Seven seconds command delay.', value: '7' },
                    { label: '8 seconds', description: 'Eight seconds command delay.', value: '8' }]
            }));
    },

    getSmartSwitchSelectMenu: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        let autoDayNightString = 'AUTO SETTING: ';
        if (entity.autoDayNight === 0) autoDayNightString += 'OFF';
        else if (entity.autoDayNight === 1) autoDayNightString += 'AUTO-DAY';
        else if (entity.autoDayNight === 2) autoDayNightString += 'AUTO-NIGHT';

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getSelectMenu({
                customId: `AutoDayNight${identifier}`,
                placeholder: `${autoDayNightString}`,
                options: [
                    {
                        label: 'OFF',
                        description: 'Smart Switch work as normal.',
                        value: '0'
                    },
                    {
                        label: 'AUTO-DAY',
                        description: `Smart Switch Will be active only during the day.`,
                        value: '1'
                    },
                    {
                        label: 'AUTO-NIGHT',
                        description: `Smart Switch Will be active only during the night.`,
                        value: '2'
                    }]
            }));
    },
}