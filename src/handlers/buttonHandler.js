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
        let id = interaction.customId.replace('SmartSwitchOnId', '').replace('SmartSwitchOffId', '');

        if (!instance.switches.hasOwnProperty(id)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Switch with id '${id}' does not exist in the instance file.`, 'error')
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
            if (instance.switches[id].serverId !== rustplus.serverId) {
                try {
                    interaction.deferUpdate();
                }
                catch (e) {
                    client.log('ERROR', 'Could not defer the interaction.', 'error')
                }
                client.log('ERROR', 'Smart Switch is not part of the connected rustplus instance.', 'error');
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
        }

        if (rustplus.currentSwitchTimeouts.hasOwnProperty(id)) {
            clearTimeout(rustplus.currentSwitchTimeouts[id]);
            delete rustplus.currentSwitchTimeouts[id];
        }

        let active = (interaction.customId.startsWith('SmartSwitchOn')) ? true : false;

        let prevActive = instance.switches[id].active;
        instance.switches[id].active = active;
        client.writeInstanceFile(guildId, instance);

        rustplus.interactionSwitches.push(id);

        let response = null;
        if (active) {
            response = await rustplus.turnSmartSwitchOnAsync(id);
        }
        else {
            response = await rustplus.turnSmartSwitchOffAsync(id);
        }

        if (!(await rustplus.isResponseValid(response))) {
            if (instance.switches[id].reachable) {
                await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId, id);
            }
            instance.switches[id].reachable = false;
            instance.switches[id].active = prevActive;
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
        }
        else {
            instance.switches[id].reachable = true;
            client.writeInstanceFile(rustplus.guildId, instance);
        }

        DiscordMessages.sendSmartSwitchMessage(guildId, id, interaction);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
            client, interaction.guildId, instance.switches[id].serverId, id);
    }
    else if (interaction.customId.startsWith('SmartSwitchEdit')) {
        let id = interaction.customId.replace('SmartSwitchEditId', '');

        const modal = DiscordModals.getSmartSwitchEditModal(interaction.guildId, id);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('SmartSwitchDelete')) {
        let id = interaction.customId.replace('SmartSwitchDeleteId', '');
        let serverId = null;

        if (instance.switches.hasOwnProperty(id)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
                instance.switches[id].messageId);

            serverId = instance.switches[id].serverId;
            delete instance.switches[id];
            client.writeInstanceFile(guildId, instance);
        }

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[id]);
            delete rustplus.currentSwitchTimeouts[id];
        }

        for (const [groupName, groupContent] of Object.entries(instance.serverList[serverId].switchGroups)) {
            if (groupContent.switches.includes(id)) {
                instance.serverList[serverId].switchGroups[groupName].switches =
                    groupContent.switches.filter(e => e !== id);
                client.writeInstanceFile(guildId, instance);
                await DiscordMessages.sendSmartSwitchGroupMessage(guildId, groupName);
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
    else if (interaction.customId.startsWith('TurnOnGroup') ||
        interaction.customId.startsWith('TurnOffGroup')) {
        let id = interaction.customId.replace('TurnOnGroupId', '');
        id = id.replace('TurnOffGroupId', '');

        if (rustplus.currentSwitchTimeouts.hasOwnProperty(id)) {
            clearTimeout(rustplus.currentSwitchTimeouts[id]);
            delete rustplus.currentSwitchTimeouts[id];
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

        if (!instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(id)) {
            client.log('ERROR', 'Switch group does not exist.', 'error')
            return;
        }

        if (instance.serverList[rustplus.serverId].switchGroups[id].serverId !== rustplus.serverId) {
            client.log('ERROR', 'Smart Switch Group is not part of the connected rustplus instance.', 'error');
            return;
        }
        else {
            if (!rustplus.connected) {
                client.log('ERROR', 'Rustplus is not connected, cannot use  the Smart Switch Group...', 'error');
                return;
            }
        }

        let active = (interaction.customId.startsWith('TurnOnGroup') ? true : false);

        await SmartSwitchGroupHandler.TurnOnOffGroup(
            client, rustplus, interaction.guildId, rustplus.serverId, id, active);
    }
    else if (interaction.customId.startsWith('DeleteGroup')) {
        let id = interaction.customId.replace('DeleteGroupId', '');

        if (!rustplus) {
            client.log('ERROR', 'Rustplus is not connected, cannot delete the Smart Switch Group...', 'error');
            return;
        }

        clearTimeout(rustplus.currentSwitchTimeouts[id]);
        delete rustplus.currentSwitchTimeouts[id];

        if (instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(id)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
                instance.serverList[rustplus.serverId].switchGroups[id].messageId);

            delete instance.serverList[rustplus.serverId].switchGroups[id];
            client.writeInstanceFile(guildId, instance);
        }
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
    else if (interaction.customId.startsWith('TrackerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerDelete', ''));

        if (instance.trackers.hasOwnProperty(ids.trackerId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.trackers,
                instance.trackers[ids.trackerId].messageId);

            delete instance.trackers[ids.trackerId];
            client.writeInstanceFile(guildId, instance);
        }
    }
}
