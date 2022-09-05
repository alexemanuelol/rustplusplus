const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;

    if (interaction.customId.startsWith('SmartSwitchEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchEdit', ''));
        const smartSwitchName = interaction.fields.getTextInputValue('SmartSwitchName');
        const smartSwitchCommand = interaction.fields.getTextInputValue('SmartSwitchCommand');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].switches.hasOwnProperty(ids.entityId))) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].switches[ids.entityId].name = smartSwitchName;

        if (smartSwitchCommand !== instance.serverList[ids.serverId].switches[ids.entityId].command &&
            !Keywords.getListOfUsedKeywords(client, guildId, ids.serverId).includes(smartSwitchCommand)) {
            instance.serverList[ids.serverId].switches[ids.entityId].command = smartSwitchCommand;
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('GroupEdit')) {
        const ids = JSON.parse(interaction.customId.replace('GroupEdit', ''));
        const groupName = interaction.fields.getTextInputValue('GroupName');
        const groupCommand = interaction.fields.getTextInputValue('GroupCommand');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].switchGroups.hasOwnProperty(ids.groupId))) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].switchGroups[ids.groupId].name = groupName;

        if (groupCommand !== instance.serverList[ids.serverId].switchGroups[ids.groupId].command &&
            !Keywords.getListOfUsedKeywords(client, interaction.guildId, ids.serverId).includes(groupCommand)) {
            instance.serverList[ids.serverId].switchGroups[ids.groupId].command = groupCommand;
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, ids.serverId, ids.groupId);
    }
    else if (interaction.customId.startsWith('GroupAddSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupAddSwitch', ''));
        const switchId = interaction.fields.getTextInputValue('GroupAddSwitchId');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].switchGroups.hasOwnProperty(ids.groupId))) {
            interaction.deferUpdate();
            return;
        }

        if (!Object.keys(instance.serverList[ids.serverId].switches).includes(switchId) ||
            instance.serverList[ids.serverId].switchGroups[ids.groupId].switches.includes(switchId)) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].switchGroups[ids.groupId].switches.push(switchId);
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, ids.serverId, ids.groupId);
    }
    else if (interaction.customId.startsWith('GroupRemoveSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupRemoveSwitch', ''));
        const switchId = interaction.fields.getTextInputValue('GroupRemoveSwitchId');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].switchGroups.hasOwnProperty(ids.groupId))) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].switchGroups[ids.groupId].switches =
            instance.serverList[ids.serverId].switchGroups[ids.groupId].switches.filter(e => e !== switchId);
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, ids.serverId, ids.groupId);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));
        let smartAlarmName = interaction.fields.getTextInputValue('SmartAlarmName');
        let smartAlarmMessage = interaction.fields.getTextInputValue('SmartAlarmMessage');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].alarms.hasOwnProperty(ids.entityId))) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].alarms[ids.entityId].name = smartAlarmName;
        instance.serverList[ids.serverId].alarms[ids.entityId].message = smartAlarmMessage;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('StorageMonitorEdit')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorEdit', ''));
        const storageMonitorName = interaction.fields.getTextInputValue('StorageMonitorName');

        if (!instance.serverList.hasOwnProperty(ids.serverId) || (instance.serverList.hasOwnProperty(ids.serverId) &&
            !instance.serverList[ids.serverId].storageMonitors.hasOwnProperty(ids.entityId))) {
            interaction.deferUpdate();
            return;
        }

        instance.serverList[ids.serverId].storageMonitors[ids.entityId].name = storageMonitorName;
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('TrackerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEdit', ''));
        const trackerName = interaction.fields.getTextInputValue('TrackerName');

        if (!instance.trackers.hasOwnProperty(ids.trackerId)) {
            interaction.deferUpdate();
            return;
        }

        instance.trackers[ids.trackerId].name = trackerName;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }
    else if (interaction.customId.startsWith('TrackerAddPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayer', ''));
        const steamId = interaction.fields.getTextInputValue('TrackerAddPlayerSteamId');

        if (!instance.trackers.hasOwnProperty(ids.trackerId)) {
            interaction.deferUpdate();
            return;
        }

        if (instance.trackers[ids.trackerId].players.some(e => e.steamId === steamId)) {
            interaction.deferUpdate();
            return;
        }

        instance.trackers[ids.trackerId].players.push({
            name: '-', steamId: steamId, playerId: null, status: false, time: null
        });
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);

        /* To force search of player name via scrape */
        client.battlemetricsIntervalCounter = 0;
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayer', ''));
        const steamId = interaction.fields.getTextInputValue('TrackerRemovePlayerSteamId');

        if (!instance.trackers.hasOwnProperty(ids.trackerId)) {
            interaction.deferUpdate();
            return;
        }

        instance.trackers[ids.trackerId].players =
            instance.trackers[ids.trackerId].players.filter(e => e.steamId !== steamId);
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }

    interaction.deferUpdate();
}