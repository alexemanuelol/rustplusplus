const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const DiscordButtons = require('..//discordTools/discordButtons.js');
const DiscordModals = require('../discordTools/discordModals.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;
    const rustplus = client.rustplusInstances[guildId];

    if (interaction.customId.startsWith('DiscordNotification')) {
        let setting = interaction.customId.replace('DiscordNotificationId', '');
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.notificationSettings[setting].discord = instance.notificationSettings[setting].discord;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getNotificationButtons(
                setting, instance.notificationSettings[setting].discord,
                instance.notificationSettings[setting].inGame)]
        });
    }
    else if (interaction.customId.startsWith('InGameNotification')) {
        let setting = interaction.customId.replace('InGameNotificationId', '');
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.notificationSettings[setting].inGame = instance.notificationSettings[setting].inGame;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getNotificationButtons(
                setting, instance.notificationSettings[setting].discord,
                instance.notificationSettings[setting].inGame)]
        });
    }
    else if (interaction.customId === 'AllowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameCommandsEnabledButton(instance.generalSettings.inGameCommandsEnabled)]
        });

    }
    else if (interaction.customId === 'InGameTeammateConnection') {
        instance.generalSettings.connectionNotify = !instance.generalSettings.connectionNotify;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.connectionNotify = instance.generalSettings.connectionNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(instance)]
        });
    }
    else if (interaction.customId === 'InGameTeammateAfk') {
        instance.generalSettings.afkNotify = !instance.generalSettings.afkNotify;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.afkNotify = instance.generalSettings.afkNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(instance)]
        });
    }
    else if (interaction.customId === 'InGameTeammateDeath') {
        instance.generalSettings.deathNotify = !instance.generalSettings.deathNotify;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.deathNotify = instance.generalSettings.deathNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(instance)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotification') {
        instance.generalSettings.fcmAlarmNotificationEnabled = !instance.generalSettings.fcmAlarmNotificationEnabled;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEnabled =
            instance.generalSettings.fcmAlarmNotificationEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getFcmAlarmNotificationButtons(
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotificationEveryone') {
        instance.generalSettings.fcmAlarmNotificationEveryone = !instance.generalSettings.fcmAlarmNotificationEveryone;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEveryone =
            instance.generalSettings.fcmAlarmNotificationEveryone;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getFcmAlarmNotificationButtons(
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'SmartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.smartAlarmNotifyInGame =
            instance.generalSettings.smartAlarmNotifyInGame;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getSmartAlarmNotifyInGameButton(
                instance.generalSettings.smartAlarmNotifyInGame)]
        });
    }
    else if (interaction.customId === 'LeaderCommandEnabled') {
        instance.generalSettings.leaderCommandEnabled = !instance.generalSettings.leaderCommandEnabled;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.leaderCommandEnabled = instance.generalSettings.leaderCommandEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getLeaderCommandEnabledButton(
                instance.generalSettings.leaderCommandEnabled)]
        });
    }
    else if (interaction.customId === 'TrackerNotifyAllOffline') {
        instance.generalSettings.trackerNotifyAllOffline = !instance.generalSettings.trackerNotifyAllOffline;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.trackerNotifyAllOffline =
            instance.generalSettings.trackerNotifyAllOffline;

        await client.interactionUpdate(interaction, {
            components: [getTrackerNotifyButtons(
                instance.generalSettings.trackerNotifyAllOffline,
                instance.generalSettings.trackerNotifyAnyOnline)]
        });
    }
    else if (interaction.customId === 'TrackerNotifyAnyOnline') {
        instance.generalSettings.trackerNotifyAnyOnline = !instance.generalSettings.trackerNotifyAnyOnline;
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.trackerNotifyAnyOnline =
            instance.generalSettings.trackerNotifyAnyOnline;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getTrackerNotifyButtons(
                instance.generalSettings.trackerNotifyAllOffline,
                instance.generalSettings.trackerNotifyAnyOnline)]
        });
    }
    else if (interaction.customId.startsWith('ServerConnect')) {
        const ids = JSON.parse(interaction.customId.replace('ServerConnect', ''));

        for (const [key, value] of Object.entries(instance.serverList)) {
            if (value.active) {
                instance.serverList[key].active = false;
                await DiscordMessages.sendServerMessage(guildId, key, null);
                break;
            }
        }

        instance.serverList[ids.serverId].active = true;
        client.writeInstanceFile(guildId, instance);
        await DiscordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);

        /* Disconnect previous instance is any */
        if (rustplus) rustplus.disconnect();

        /* Create the rustplus instance */
        const newRustplus = client.createRustplusInstance(
            guildId,
            instance.serverList[ids.serverId].serverIp,
            instance.serverList[ids.serverId].appPort,
            instance.serverList[ids.serverId].steamId,
            instance.serverList[ids.serverId].playerToken
        );

        newRustplus.newConnection = true;
    }
    else if (interaction.customId.startsWith('CreateTracker')) {
        const ids = JSON.parse(interaction.customId.replace('CreateTracker', ''));
        const battlemetricsId = instance.serverList[ids.serverId].battlemetricsId;

        interaction.deferUpdate();

        /* Find an available tracker id */
        const trackerId = client.findAvailableTrackerId(guildId);

        instance.trackers[trackerId] = {
            name: 'Tracker',
            serverId: ids.serverId,
            battlemetricsId: battlemetricsId,
            status: false,
            allOffline: true,
            messageId: null,
            active: true,
            everyone: false,
            players: [],
            img: instance.serverList[ids.serverId].img,
            title: instance.serverList[ids.serverId].title
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, trackerId);
    }
    else if (interaction.customId.startsWith('ServerDisconnect') ||
        interaction.customId.startsWith('ServerReconnecting')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDisconnect', '')
            .replace('ServerReconnecting', ''));

        instance.serverList[ids.serverId].active = false;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);

        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.startsWith('ServerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDelete', ''));

        if (rustplus && (rustplus.serverId === ids.serverId || instance.serverList[ids.serverId].active)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);

            for (const [key, value] of Object.entries(instance.switches)) {
                if (`${value.serverId}` === ids.serverId) {
                    delete instance.switches[key];
                }
            }

            for (const [key, value] of Object.entries(instance.serverList[ids.serverId].alarms)) {
                await DiscordTools.deleteMessageById(guildId, instance.channelId.alarms,
                    instance.serverList[ids.serverId].alarms[key].messageId);
            }

            rustplus.disconnect();
            rustplus.deleted = true;
            delete client.rustplusInstances[guildId];
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.servers,
            instance.serverList[ids.serverId].messageId);

        delete instance.serverList[ids.serverId];
        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartSwitchOn') ||
        interaction.customId.startsWith('SmartSwitchOff')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchOn', '').replace('SmartSwitchOff', ''));

        if (!instance.serverList[ids.serverId].switches.hasOwnProperty(ids.entityId)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Switch with id '${ids.entityId}' does not exist in the instance file.`, 'error')
            return;
        }

        if (!rustplus) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer the interaction.', 'error')
            }
            client.log('ERROR', 'Rustplus is not available, cannot use Smart Switches...', 'error')
            return;
        }
        else {
            if (!rustplus.connected) {
                try {
                    interaction.deferUpdate();
                }
                catch (e) {
                    client.log('ERROR', 'Could not defer the interaction.', 'error')
                }
                client.log('ERROR', 'Rustplus is not connected, cannot use Smart Switches...', 'error');
                return;
            }
        }

        if (rustplus.currentSwitchTimeouts.hasOwnProperty(ids.entityId)) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
            delete rustplus.currentSwitchTimeouts[ids.entityId];
        }

        let active = (interaction.customId.startsWith('SmartSwitchOn')) ? true : false;

        let prevActive = instance.serverList[ids.serverId].switches[ids.entityId].active;
        instance.serverList[ids.serverId].switches[ids.entityId].active = active;
        client.writeInstanceFile(guildId, instance);

        rustplus.interactionSwitches.push(ids.entityId);

        let response = null;
        if (active) {
            response = await rustplus.turnSmartSwitchOnAsync(ids.entityId);
        }
        else {
            response = await rustplus.turnSmartSwitchOffAsync(ids.entityId);
        }

        if (!(await rustplus.isResponseValid(response))) {
            if (instance.serverList[ids.serverId].switches[ids.entityId].reachable) {
                await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId, ids.entityId);
            }
            instance.serverList[ids.serverId].switches[ids.entityId].reachable = false;
            instance.serverList[ids.serverId].switches[ids.entityId].active = prevActive;
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== ids.entityId);
        }
        else {
            instance.serverList[ids.serverId].switches[ids.entityId].reachable = true;
            client.writeInstanceFile(rustplus.guildId, instance);
        }

        DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
            client, interaction.guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('SmartSwitchEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchEdit', ''));

        const modal = DiscordModals.getSmartSwitchEditModal(interaction.guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('SmartSwitchDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchDelete', ''));

        if (instance.serverList[ids.serverId].switches.hasOwnProperty(ids.entityId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
                instance.serverList[ids.serverId].switches[ids.entityId].messageId);

            delete instance.serverList[ids.serverId].switches[ids.entityId];
            client.writeInstanceFile(guildId, instance);
        }

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
            delete rustplus.currentSwitchTimeouts[ids.entityId];
        }

        for (const [groupName, groupContent] of Object.entries(instance.serverList[ids.serverId].switchGroups)) {
            if (groupContent.switches.includes(ids.entityId)) {
                instance.serverList[ids.serverId].switchGroups[groupName].switches =
                    groupContent.switches.filter(e => e !== ids.entityId);
                client.writeInstanceFile(guildId, instance);
                await DiscordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupName);
            }
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartAlarmEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEveryone', ''));

        if (instance.serverList[ids.serverId].alarms.hasOwnProperty(ids.entityId)) {
            instance.serverList[ids.serverId].alarms[ids.entityId].everyone =
                !instance.serverList[ids.serverId].alarms[ids.entityId].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, ids.serverId, ids.entityId, interaction);
        }
        else {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Smart Alarm with id '${ids.entityId}' does not exist in the instance file.`, 'error');
        }
    }
    else if (interaction.customId.startsWith('SmartAlarmDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmDelete', ''));

        if (instance.serverList[ids.serverId].alarms.hasOwnProperty(ids.entityId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.alarms,
                instance.serverList[ids.serverId].alarms[ids.entityId].messageId);

            delete instance.serverList[ids.serverId].alarms[ids.entityId];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));

        const modal = DiscordModals.getSmartAlarmEditModal(interaction.guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardEveryone', ''));

        if (instance.serverList[ids.serverId].storageMonitors.hasOwnProperty(ids.entityId)) {
            instance.serverList[ids.serverId].storageMonitors[ids.entityId].everyone =
                !instance.serverList[ids.serverId].storageMonitors[ids.entityId].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, ids.serverId,
                ids.entityId, interaction);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardInGame')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardInGame', ''));

        if (instance.serverList[ids.serverId].storageMonitors.hasOwnProperty(ids.entityId)) {
            instance.serverList[ids.serverId].storageMonitors[ids.entityId].inGame =
                !instance.serverList[ids.serverId].storageMonitors[ids.entityId].inGame;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, ids.serverId,
                ids.entityId, interaction);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardDelete', ''));

        if (instance.serverList[ids.serverId].storageMonitors.hasOwnProperty(ids.entityId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
                instance.serverList[ids.serverId].storageMonitors[ids.entityId].messageId);

            delete instance.serverList[ids.serverId].storageMonitors[ids.entityId];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorContainerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorContainerDelete', ''));

        if (instance.serverList[ids.serverId].storageMonitors.hasOwnProperty(ids.entityId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
                instance.serverList[ids.serverId].storageMonitors[ids.entityId].messageId);

            delete instance.serverList[ids.serverId].storageMonitors[ids.entityId];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('GroupTurnOn') ||
        interaction.customId.startsWith('GroupTurnOff')) {
        const ids = JSON.parse(interaction.customId.replace('GroupTurnOn', '').replace('GroupTurnOff', ''));

        if (rustplus.currentSwitchTimeouts.hasOwnProperty(ids.group)) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.group]);
            delete rustplus.currentSwitchTimeouts[ids.group];
        }

        try {
            interaction.deferUpdate();
        }
        catch (e) {
            client.log('ERROR', 'Could not defer the interaction.', 'error');
        }

        if (!rustplus) {
            client.log('ERROR', 'Rustplus is not connected, cannot use Smart Switch Groups...', 'error');
            return;
        }

        if (!instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(ids.group)) {
            client.log('ERROR', 'Switch group does not exist.', 'error')
            return;
        }

        if (instance.serverList[rustplus.serverId].switchGroups[ids.group].serverId !== rustplus.serverId) {
            client.log('ERROR', 'Smart Switch Group is not part of the connected rustplus instance.', 'error');
            return;
        }
        else {
            if (!rustplus.connected) {
                client.log('ERROR', 'Rustplus is not connected, cannot use  the Smart Switch Group...', 'error');
                return;
            }
        }

        let active = (interaction.customId.startsWith('GroupTurnOn') ? true : false);

        await SmartSwitchGroupHandler.TurnOnOffGroup(
            client, rustplus, interaction.guildId, rustplus.serverId, ids.group, active);
    }
    else if (interaction.customId.startsWith('GroupEdit')) {
        const ids = JSON.parse(interaction.customId.replace('GroupEdit', ''));

        const modal = DiscordModals.getGroupEditModal(interaction.guildId, ids.serverId, ids.group);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupDelete')) {
        const ids = JSON.parse(interaction.customId.replace('GroupDelete', ''));

        if (!rustplus) {
            client.log('ERROR', 'Rustplus is not connected, cannot delete the Smart Switch Group...', 'error');
            return;
        }

        clearTimeout(rustplus.currentSwitchTimeouts[ids.group]);
        delete rustplus.currentSwitchTimeouts[ids.group];

        if (instance.serverList[ids.serverId].switchGroups.hasOwnProperty(ids.group)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
                instance.serverList[ids.serverId].switchGroups[ids.group].messageId);

            delete instance.serverList[ids.serverId].switchGroups[ids.group];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('GroupAddSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupAddSwitch', ''));

        const modal = DiscordModals.getGroupAddSwitchModal(ids.serverId, ids.group);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupRemoveSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupRemoveSwitch', ''));

        const modal = DiscordModals.getGroupRemoveSwitchModal(ids.serverId, ids.group);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerActive')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerActive', ''));

        if (instance.trackers.hasOwnProperty(ids.trackerId)) {
            instance.trackers[ids.trackerId].active = !instance.trackers[ids.trackerId].active;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId, interaction);
        }
    }
    else if (interaction.customId.startsWith('TrackerEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEveryone', ''));

        if (instance.trackers.hasOwnProperty(ids.trackerId)) {
            instance.trackers[ids.trackerId].everyone = !instance.trackers[ids.trackerId].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId, interaction);
        }
    }
    else if (interaction.customId.startsWith('TrackerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEdit', ''));

        const modal = DiscordModals.getTrackerEditModal(interaction.guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerDelete', ''));

        if (instance.trackers.hasOwnProperty(ids.trackerId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.trackers,
                instance.trackers[ids.trackerId].messageId);

            delete instance.trackers[ids.trackerId];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('TrackerAddPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayer', ''));

        const modal = DiscordModals.getTrackerAddPlayerModal(interaction.guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayer', ''));

        const modal = DiscordModals.getTrackerRemovePlayerModal(interaction.guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
}
