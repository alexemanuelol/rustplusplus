const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const DiscordButtons = require('..//discordTools/discordButtons.js');
const DiscordModals = require('../discordTools/discordModals.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    if (interaction.customId.startsWith('DiscordNotification')) {
        let setting = interaction.customId.replace('DiscordNotificationId', '');
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;

        if (rustplus) {
            rustplus.notificationSettings[setting].discord = instance.notificationSettings[setting].discord;
        }

        let row = DiscordButtons.getNotificationButtons(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('InGameNotification')) {
        let setting = interaction.customId.replace('InGameNotificationId', '');
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;

        if (rustplus) {
            rustplus.notificationSettings[setting].inGame = instance.notificationSettings[setting].inGame;
        }

        let row = DiscordButtons.getNotificationButtons(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'AllowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;

        if (rustplus) {
            rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;
        }

        let row = DiscordButtons.getInGameCommandsEnabledButton(instance.generalSettings.inGameCommandsEnabled);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'InGameTeammateConnection') {
        instance.generalSettings.connectionNotify = !instance.generalSettings.connectionNotify;

        if (rustplus) {
            rustplus.generalSettings.connectionNotify = instance.generalSettings.connectionNotify;
        }

        let row = DiscordButtons.getInGameTeammateNotificationsButtons(instance);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'InGameTeammateAfk') {
        instance.generalSettings.afkNotify = !instance.generalSettings.afkNotify;

        if (rustplus) {
            rustplus.generalSettings.afkNotify = instance.generalSettings.afkNotify;
        }

        let row = DiscordButtons.getInGameTeammateNotificationsButtons(instance);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'InGameTeammateDeath') {
        instance.generalSettings.deathNotify = !instance.generalSettings.deathNotify;

        if (rustplus) {
            rustplus.generalSettings.deathNotify = instance.generalSettings.deathNotify;
        }

        let row = DiscordButtons.getInGameTeammateNotificationsButtons(instance);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'FcmAlarmNotification') {
        instance.generalSettings.fcmAlarmNotificationEnabled = !instance.generalSettings.fcmAlarmNotificationEnabled;

        if (rustplus) {
            rustplus.generalSettings.fcmAlarmNotificationEnabled = instance.generalSettings.fcmAlarmNotificationEnabled;
        }

        let row = DiscordButtons.getFcmAlarmNotificationButtons(
            instance.generalSettings.fcmAlarmNotificationEnabled,
            instance.generalSettings.fcmAlarmNotificationEveryone);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'FcmAlarmNotificationEveryone') {
        instance.generalSettings.fcmAlarmNotificationEveryone = !instance.generalSettings.fcmAlarmNotificationEveryone;

        if (rustplus) {
            rustplus.generalSettings.fcmAlarmNotificationEveryone =
                instance.generalSettings.fcmAlarmNotificationEveryone;
        }

        let row = DiscordButtons.getFcmAlarmNotificationButtons(
            instance.generalSettings.fcmAlarmNotificationEnabled,
            instance.generalSettings.fcmAlarmNotificationEveryone);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'SmartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;

        if (rustplus) {
            rustplus.generalSettings.smartAlarmNotifyInGame = instance.generalSettings.smartAlarmNotifyInGame;
        }

        let row = DiscordButtons.getSmartAlarmNotifyInGameButton(instance.generalSettings.smartAlarmNotifyInGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'LeaderCommandEnabled') {
        instance.generalSettings.leaderCommandEnabled = !instance.generalSettings.leaderCommandEnabled;

        if (rustplus) {
            rustplus.generalSettings.leaderCommandEnabled = instance.generalSettings.leaderCommandEnabled;
        }

        let row = DiscordButtons.getLeaderCommandEnabledButton(instance.generalSettings.leaderCommandEnabled);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'TrackerNotifyAllOffline') {
        instance.generalSettings.trackerNotifyAllOffline = !instance.generalSettings.trackerNotifyAllOffline;

        if (rustplus) {
            rustplus.generalSettings.trackerNotifyAllOffline = instance.generalSettings.trackerNotifyAllOffline;
        }

        let row = DiscordButtons.getTrackerNotifyButtons(
            instance.generalSettings.trackerNotifyAllOffline,
            instance.generalSettings.trackerNotifyAnyOnline);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'TrackerNotifyAnyOnline') {
        instance.generalSettings.trackerNotifyAnyOnline = !instance.generalSettings.trackerNotifyAnyOnline;

        if (rustplus) {
            rustplus.generalSettings.trackerNotifyAnyOnline = instance.generalSettings.trackerNotifyAnyOnline;
        }

        let row = DiscordButtons.getTrackerNotifyButtons(
            instance.generalSettings.trackerNotifyAllOffline,
            instance.generalSettings.trackerNotifyAnyOnline);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('ServerConnect')) {
        let serverId = interaction.customId.replace('ServerConnectId', '');

        if (!instance.serverList.hasOwnProperty(serverId)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Server with id '${serverId}' does not exist in the instance file.`, 'error');
            return;
        }

        for (const [key, value] of Object.entries(instance.serverList)) {
            if (value.active) {
                instance.serverList[key].active = false;
                client.writeInstanceFile(guildId, instance);
                await DiscordMessages.sendServerMessage(guildId, key, null);
                break;
            }
        }

        instance = client.readInstanceFile(guildId);
        instance.serverList[serverId].active = true;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendServerMessage(guildId, serverId, null, interaction);

        /* Disconnect previous instance is any */
        if (rustplus) {
            rustplus.disconnect();
        }

        /* Create the rustplus instance */
        const newRustplus = client.createRustplusInstance(
            guildId,
            instance.serverList[serverId].serverIp,
            instance.serverList[serverId].appPort,
            instance.serverList[serverId].steamId,
            instance.serverList[serverId].playerToken
        );

        newRustplus.newConnection = true;
    }
    else if (interaction.customId.startsWith('CreateTracker')) {
        let serverId = interaction.customId.replace('CreateTrackerId', '');

        if (!instance.serverList.hasOwnProperty(serverId)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Server with id '${serverId}' does not exist in the instance file.`, 'error');
            return;
        }

        let battlemetricsId = instance.serverList[serverId].battlemetricsId;

        try {
            interaction.deferUpdate();
        }
        catch (e) {
            client.log('ERROR', 'Could not defer interaction.', 'error');
        }

        /* Find an available tracker name */
        let name = client.findAvailableTrackerName(interaction.guildId);

        instance.trackers[name] = {
            serverId: serverId,
            battlemetricsId: battlemetricsId,
            status: false,
            allOffline: true,
            messageId: null,
            active: true,
            everyone: false,
            players: [],
            img: instance.serverList[serverId].img,
            title: instance.serverList[serverId].title
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, name);
    }
    else if (interaction.customId.startsWith('ServerDisconnect') ||
        interaction.customId.startsWith('ServerReconnecting')) {
        let serverId = interaction.customId.replace('ServerDisconnectId', '');
        serverId = serverId.replace('ServerReconnectingId', '');

        if (!instance.serverList.hasOwnProperty(serverId)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Server with id '${serverId}' does not exist in the instance file.`, 'error');
            return;
        }

        instance.serverList[serverId].active = false;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendServerMessage(guildId, serverId, null, interaction);

        /* Disconnect previous instance if any */
        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.startsWith('ServerDelete')) {
        let serverId = interaction.customId.replace('ServerDeleteId', '');

        if (!instance.serverList.hasOwnProperty(serverId)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Server with id '${serverId}' does not exist in the instance file.`, 'error');
            return;
        }

        if (instance.serverList[serverId].active) {
            if (rustplus) {
                rustplus.disconnect();
                rustplus.deleted = true;
                delete client.rustplusInstances[guildId];
            }
        }

        let messageId = instance.serverList[serverId].messageId;
        let message = await DiscordTools.getMessageById(guildId, instance.channelId.servers, messageId);
        if (message !== undefined) {
            try {
                await message.delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete server message with id: ${messageId}.`, 'error');
            }
        }

        delete instance.serverList[serverId];

        /* Remove all Smart Switches associated with this server */
        for (const [key, value] of Object.entries(instance.switches)) {
            if (`${value.serverId}` === serverId) {
                delete instance.switches[key];
            }
        }
        if (rustplus && (serverId === rustplus.serverId)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
        }

        /* Remove all Smart Alarms associated with this server */
        for (const [key, value] of Object.entries(instance.alarms)) {
            if (`${value.serverId}` === serverId) {
                let messageId = instance.alarms[key].messageId;
                let message = await DiscordTools.getMessageById(
                    rustplus.guildId, instance.channelId.alarms, messageId);
                if (message !== undefined) {
                    try {
                        await message.delete();
                    }
                    catch (e) {
                        client.log('ERROR', `Could not delete alarm message with id: ${messageId}.`, 'error');
                    }
                }

                delete instance.alarms[key];
            }
        }

        /* Remove all Storage Monitors associated with this server. */
        for (const [key, value] of Object.entries(instance.storageMonitors)) {
            if (`${value.serverId}` === serverId) {
                delete instance.storageMonitors[key];
            }
        }
        if (rustplus && (serverId === rustplus.serverId)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);
        }

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
        let id = interaction.customId.replace('SmartAlarmEveryoneId', '');

        if (instance.alarms.hasOwnProperty(id)) {
            instance.alarms[id].everyone = !instance.alarms[id].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, id, interaction);
        }
        else {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer interaction.', 'error');
            }
            client.log('ERROR', `Smart Alarm with id '${id}' does not exist in the instance file.`, 'error');
        }
    }
    else if (interaction.customId.startsWith('SmartAlarmDelete')) {
        let id = interaction.customId.replace('SmartAlarmDeleteId', '');

        if (instance.alarms.hasOwnProperty(id)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.alarms,
                instance.alarms[id].messageId);

            delete instance.alarms[id];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        let id = interaction.customId.replace('SmartAlarmEditId', '');

        const modal = DiscordModals.getSmartAlarmEditModal(interaction.guildId, id);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardEveryone')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardEveryoneId', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            instance.storageMonitors[id].everyone = !instance.storageMonitors[id].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, id, interaction);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardInGame')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardInGameId', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            instance.storageMonitors[id].inGame = !instance.storageMonitors[id].inGame;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendStorageMonitorMessage(interaction.guildId, id, interaction);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardDelete')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardDeleteId', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
                instance.storageMonitors[id].messageId);

            delete instance.storageMonitors[id];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('StorageMonitorContainerDelete')) {
        let id = interaction.customId.replace('StorageMonitorContainerDeleteId', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
                instance.storageMonitors[id].messageId);

            delete instance.storageMonitors[id];
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
        let trackerName = interaction.customId.replace('TrackerActiveId', '');

        if (instance.trackers.hasOwnProperty(trackerName)) {
            instance.trackers[trackerName].active = !instance.trackers[trackerName].active;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendTrackerMessage(interaction.guildId, trackerName, interaction);
        }
    }
    else if (interaction.customId.startsWith('TrackerEveryone')) {
        let trackerName = interaction.customId.replace('TrackerEveryoneId', '');

        if (instance.trackers.hasOwnProperty(trackerName)) {
            instance.trackers[trackerName].everyone = !instance.trackers[trackerName].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordMessages.sendTrackerMessage(interaction.guildId, trackerName, interaction);
        }
    }
    else if (interaction.customId.startsWith('TrackerDelete')) {
        let trackerName = interaction.customId.replace('TrackerDeleteId', '');

        if (instance.trackers.hasOwnProperty(trackerName)) {
            let messageId = instance.trackers[trackerName].messageId;
            let message = await DiscordTools.getMessageById(guildId, instance.channelId.trackers, messageId);
            if (message !== undefined) {
                try {
                    await message.delete();
                }
                catch (e) {
                    client.log('ERROR', `Could not delete tracker message with id: ${messageId}.`, 'error');
                }
            }

            delete instance.trackers[trackerName];
            client.writeInstanceFile(guildId, instance);
        }
    }
}
