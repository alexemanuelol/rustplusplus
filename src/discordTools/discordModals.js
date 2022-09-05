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
        const entity = instance.serverList[serverId].switches[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        const modal = module.exports.getModal({
            customId: `SmartSwitchEdit${identifier}`,
            title: `Editing of ${entity.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'SmartSwitchName',
                label: 'The name of the Smart Switch:',
                value: entity.name,
                style: Discord.TextInputStyle.Short
            })),
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'SmartSwitchCommand',
                label: 'The custom command for the Smart Switch:',
                value: entity.command,
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getGroupEditModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];
        const identifier = `{"serverId":"${serverId}","groupId":${groupId}}`;

        const modal = module.exports.getModal({
            customId: `GroupEdit${identifier}`,
            title: `Editing of ${group.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'GroupName',
                label: 'The name of the Group:',
                value: group.name,
                style: Discord.TextInputStyle.Short
            })),
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'GroupCommand',
                label: 'The custom command for the Group:',
                value: group.command,
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getGroupAddSwitchModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];
        const identifier = `{"serverId":"${serverId}","groupId":${groupId}}`;

        const modal = module.exports.getModal({
            customId: `GroupAddSwitch${identifier}`,
            title: `Add Switch to ${group.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'GroupAddSwitchId',
                label: 'The Entity ID of the switch to add:',
                value: '',
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getGroupRemoveSwitchModal(guildId, serverId, groupId) {
        const instance = Client.client.readInstanceFile(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];
        const identifier = `{"serverId":"${serverId}","groupId":${groupId}}`;

        const modal = module.exports.getModal({
            customId: `GroupRemoveSwitch${identifier}`,
            title: `Add Switch to ${group.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'GroupRemoveSwitchId',
                label: 'The Entity ID of the switch to remove:',
                value: '',
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getSmartAlarmEditModal(guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        const modal = module.exports.getModal({
            customId: `SmartAlarmEdit${identifier}`,
            title: `Editing of ${entity.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'SmartAlarmName',
                label: 'The name of the Smart Alarm:',
                value: entity.name,
                style: Discord.TextInputStyle.Short
            })),
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'SmartAlarmMessage',
                label: 'The message for the Smart Alarm:',
                value: entity.message,
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getStorageMonitorEditModal(guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        const modal = module.exports.getModal({
            customId: `StorageMonitorEdit${identifier}`,
            title: `Editing of ${entity.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'StorageMonitorName',
                label: 'The name of the Storage Monitor:',
                value: entity.name,
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getTrackerEditModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];
        const identifier = `{"trackerId":${trackerId}}`;

        const modal = module.exports.getModal({
            customId: `TrackerEdit${identifier}`,
            title: `Editing of ${tracker.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'TrackerName',
                label: 'The name of the Tracker:',
                value: tracker.name,
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getTrackerAddPlayerModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];
        const identifier = `{"trackerId":${trackerId}}`;

        const modal = module.exports.getModal({
            customId: `TrackerAddPlayer${identifier}`,
            title: `Add Player to ${tracker.name}`
        });


        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'TrackerAddPlayerSteamId',
                label: 'The SteamID of the player to add:',
                value: '',
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },

    getTrackerRemovePlayerModal(guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];
        const identifier = `{"trackerId":${trackerId}}`;

        const modal = module.exports.getModal({
            customId: `TrackerRemovePlayer${identifier}`,
            title: `Remove Player from ${tracker.name}`
        });

        modal.addComponents(
            new Discord.ActionRowBuilder().addComponents(TextInput.getTextInput({
                customId: 'TrackerRemovePlayerSteamId',
                label: 'The SteamID of the player to remove:',
                value: '',
                style: Discord.TextInputStyle.Short
            }))
        );

        return modal;
    },
}