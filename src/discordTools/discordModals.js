const Discord = require('discord.js');

const Client = require('../../index.ts');
const TextInput = require('./discordTextInputs.js');

module.exports = {
    getModal: function (options = {}) {
        const modal = new Discord.ModalBuilder();

        if (options.customId) modal.setCustomId(options.customId);
        if (options.title) modal.setTitle(options.title);

        return modal;
    },

    getSmartSwitchEditModal(guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `SmartSwitchEdit{"serverId":"${serverId}","entityId":${entityId}}`,
            title: `Editing of ${instance.serverList[serverId].switches[entityId].name}`
        });

        const nameInput = TextInput.getTextInput({
            customId: 'SmartSwitchName',
            label: 'The name of the Smart Switch:',
            value: instance.serverList[serverId].switches[entityId].name,
            style: Discord.TextInputStyle.Short
        });

        const commandInput = TextInput.getTextInput({
            customId: 'SmartSwitchCommand',
            label: 'The custom command for the Smart Switch:',
            value: instance.serverList[serverId].switches[entityId].command,
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(nameInput),
            new Discord.ActionRowBuilder().addComponents(commandInput)
        );

        return modal;
    },

    getGroupEditModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `GroupEdit{"serverId":"${serverId}","groupId":${groupId}}`,
            title: `Editing of ${instance.serverList[serverId].switchGroups[groupId].name}`
        });

        const nameInput = TextInput.getTextInput({
            customId: 'GroupName',
            label: 'The name of the Group:',
            value: instance.serverList[serverId].switchGroups[groupId].name,
            style: Discord.TextInputStyle.Short
        });

        const commandInput = TextInput.getTextInput({
            customId: 'GroupCommand',
            label: 'The custom command for the Group:',
            value: instance.serverList[serverId].switchGroups[groupId].command,
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(nameInput),
            new Discord.ActionRowBuilder().addComponents(commandInput)
        );

        return modal;
    },

    getGroupAddSwitchModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `GroupAddSwitch{"serverId":"${serverId}","groupId":${groupId}}`,
            title: `Add Switch to ${instance.serverList[serverId].switchGroups[groupId].name}`
        });

        const switchIdInput = TextInput.getTextInput({
            customId: 'GroupAddSwitchId',
            label: 'The Entity ID of the switch to add:',
            value: '',
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(new Discord.ActionRowBuilder().addComponents(switchIdInput));

        return modal;
    },

    getGroupRemoveSwitchModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `GroupRemoveSwitch{"serverId":"${serverId}","groupId":${groupId}}`,
            title: `Add Switch to ${instance.serverList[serverId].switchGroups[groupId].name}`
        });

        const switchIdInput = TextInput.getTextInput({
            customId: 'GroupRemoveSwitchId',
            label: 'The Entity ID of the switch to remove:',
            value: '',
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(new Discord.ActionRowBuilder().addComponents(switchIdInput));

        return modal;
    },

    getSmartAlarmEditModal(guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `SmartAlarmEdit{"serverId":"${serverId}","entityId":${entityId}}`,
            title: `Editing of ${instance.serverList[serverId].alarms[entityId].name}`
        });

        const nameInput = TextInput.getTextInput({
            customId: 'SmartAlarmName',
            label: 'The name of the Smart Alarm:',
            value: instance.serverList[serverId].alarms[entityId].name,
            style: Discord.TextInputStyle.Short
        });

        const messageInput = TextInput.getTextInput({
            customId: 'SmartAlarmMessage',
            label: 'The message for the Smart Alarm:',
            value: instance.serverList[serverId].alarms[entityId].message,
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(nameInput),
            new Discord.ActionRowBuilder().addComponents(messageInput)
        );

        return modal;
    },

    getTrackerEditModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `TrackerEdit{"trackerId":${trackerId}}`,
            title: `Editing of ${instance.trackers[trackerId].name}`
        });

        const nameInput = TextInput.getTextInput({
            customId: 'TrackerName',
            label: 'The name of the Tracker:',
            value: instance.trackers[trackerId].name,
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(new Discord.ActionRowBuilder().addComponents(nameInput));

        return modal;
    },

    getTrackerAddPlayerModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `TrackerAddPlayer{"trackerId":${trackerId}}`,
            title: `Add Player to ${instance.trackers[trackerId].name}`
        });

        const steamIdInput = TextInput.getTextInput({
            customId: 'TrackerAddPlayerSteamId',
            label: 'The SteamID of the player to add:',
            value: '',
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(new Discord.ActionRowBuilder().addComponents(steamIdInput));

        return modal;
    },

    getTrackerRemovePlayerModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);

        const modal = module.exports.getModal({
            customId: `TrackerRemovePlayer{"trackerId":${trackerId}}`,
            title: `Remove Player from ${instance.trackers[trackerId].name}`
        });

        const steamIdInput = TextInput.getTextInput({
            customId: 'TrackerRemovePlayerSteamId',
            label: 'The SteamID of the player to remove:',
            value: '',
            style: Discord.TextInputStyle.Short
        });

        modal.addComponents(new Discord.ActionRowBuilder().addComponents(steamIdInput));

        return modal;
    },
}