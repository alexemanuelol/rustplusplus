const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    if (interaction.customId.endsWith('DiscordNotification')) {
        let setting = interaction.customId.replace('DiscordNotification', '');
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;

        if (rustplus) {
            rustplus.notificationSettings[setting].discord = instance.notificationSettings[setting].discord;
        }

        let row = DiscordTools.getNotificationButtons(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('InGameNotification')) {
        let setting = interaction.customId.replace('InGameNotification', '');
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;

        if (rustplus) {
            rustplus.notificationSettings[setting].inGame = instance.notificationSettings[setting].inGame;
        }

        let row = DiscordTools.getNotificationButtons(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'allowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;

        if (rustplus) {
            rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;
        }

        let row = DiscordTools.getInGameCommandsEnabledButton(instance.generalSettings.inGameCommandsEnabled);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'fcmAlarmNotification') {
        instance.generalSettings.fcmAlarmNotificationEnabled = !instance.generalSettings.fcmAlarmNotificationEnabled;

        if (rustplus) {
            rustplus.generalSettings.fcmAlarmNotificationEnabled = instance.generalSettings.fcmAlarmNotificationEnabled;
        }

        let row = DiscordTools.getFcmAlarmNotificationButtons(
            instance.generalSettings.fcmAlarmNotificationEnabled,
            instance.generalSettings.fcmAlarmNotificationEveryone);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'fcmAlarmNotificationEveryone') {
        instance.generalSettings.fcmAlarmNotificationEveryone = !instance.generalSettings.fcmAlarmNotificationEveryone;

        if (rustplus) {
            rustplus.generalSettings.fcmAlarmNotificationEveryone =
                instance.generalSettings.fcmAlarmNotificationEveryone;
        }

        let row = DiscordTools.getFcmAlarmNotificationButtons(
            instance.generalSettings.fcmAlarmNotificationEnabled,
            instance.generalSettings.fcmAlarmNotificationEveryone);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'smartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;

        if (rustplus) {
            rustplus.generalSettings.smartAlarmNotifyInGame = instance.generalSettings.smartAlarmNotifyInGame;
        }

        let row = DiscordTools.getSmartAlarmNotifyInGameButton(instance.generalSettings.smartAlarmNotifyInGame);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'leaderCommandEnabled') {
        instance.generalSettings.leaderCommandEnabled = !instance.generalSettings.leaderCommandEnabled;

        if (rustplus) {
            rustplus.generalSettings.leaderCommandEnabled = instance.generalSettings.leaderCommandEnabled;
        }

        let row = DiscordTools.getLeaderCommandEnabledButton(instance.generalSettings.leaderCommandEnabled);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'trackerNotifyAllOffline') {
        instance.generalSettings.trackerNotifyAllOffline = !instance.generalSettings.trackerNotifyAllOffline;

        if (rustplus) {
            rustplus.generalSettings.trackerNotifyAllOffline = instance.generalSettings.trackerNotifyAllOffline;
        }

        let row = DiscordTools.getTrackerNotifyButtons(
            instance.generalSettings.trackerNotifyAllOffline,
            instance.generalSettings.trackerNotifyAnyOnline);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'trackerNotifyAnyOnline') {
        instance.generalSettings.trackerNotifyAnyOnline = !instance.generalSettings.trackerNotifyAnyOnline;

        if (rustplus) {
            rustplus.generalSettings.trackerNotifyAnyOnline = instance.generalSettings.trackerNotifyAnyOnline;
        }

        let row = DiscordTools.getTrackerNotifyButtons(
            instance.generalSettings.trackerNotifyAllOffline,
            instance.generalSettings.trackerNotifyAnyOnline);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('ServerConnect')) {
        let serverId = interaction.customId.replace('ServerConnect', '');

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
                await DiscordTools.sendServerMessage(guildId, key, null, false, true);
                break;
            }
        }

        instance = client.readInstanceFile(guildId);
        instance.serverList[serverId].active = true;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendServerMessage(guildId, serverId, null, false, true, interaction);

        /* Disconnect previous instance is any */
        if (rustplus) {
            rustplus.disconnect();
        }

        /* Create the rustplus instance */
        client.createRustplusInstance(
            guildId,
            instance.serverList[serverId].serverIp,
            instance.serverList[serverId].appPort,
            instance.serverList[serverId].steamId,
            instance.serverList[serverId].playerToken
        );
    }
    else if (interaction.customId.endsWith('CreateTracker')) {
        let serverId = interaction.customId.replace('CreateTracker', '');

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
            players: []
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendTrackerMessage(guildId, name);
    }
    else if (interaction.customId.endsWith('ServerDisconnect') ||
        interaction.customId.endsWith('ServerReconnecting')) {
        let serverId = interaction.customId.replace('ServerDisconnect', '');
        serverId = serverId.replace('ServerReconnecting', '');

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

        await DiscordTools.sendServerMessage(guildId, serverId, null, false, true, interaction);

        /* Disconnect previous instance if any */
        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.endsWith('ServerDelete')) {
        let serverId = interaction.customId.replace('ServerDelete', '');

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
    else if (interaction.customId.endsWith('SmartSwitch')) {
        let id = interaction.customId.replace('OnSmartSwitch', '').replace('OffSmartSwitch', '');

        if (!instance.switches.hasOwnProperty(id)) {
            if (client.switchesMessages[guildId].hasOwnProperty(id)) {
                try {
                    await client.switchesMessages[guildId][id].delete();
                }
                catch (e) {
                    client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
                }
                delete client.switchesMessages[guildId][id];
            }

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

        let active = (interaction.customId.endsWith('OnSmartSwitch')) ? true : false;

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
            if (response.hasOwnProperty('error') && response.error === 'not_found') {
                await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, id);

                delete instance.switches[id];
                client.writeInstanceFile(rustplus.guildId, instance);

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);

                if (client.switchesMessages[guildId].hasOwnProperty(id)) {
                    try {
                        await client.switchesMessages[rustplus.guildId][id].delete();
                    }
                    catch (e) {
                        client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
                    }
                    delete client.switchesMessages[rustplus.guildId][id];
                }
            }

            return;
        }

        DiscordTools.sendSmartSwitchMessage(guildId, id, true, true, false, interaction);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
            client, interaction.guildId, instance.switches[id].serverId, id);
    }
    else if (interaction.customId.endsWith('SmartSwitchDelete')) {
        let id = interaction.customId.replace('SmartSwitchDelete', '');

        if (instance.switches.hasOwnProperty(id)) {
            delete instance.switches[id];
        }

        if (client.switchesMessages[guildId].hasOwnProperty(id)) {
            try {
                await client.switchesMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
            }
            delete client.switchesMessages[guildId][id];
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('SmartAlarmEveryone')) {
        let id = interaction.customId.replace('SmartAlarmEveryone', '');

        if (instance.alarms.hasOwnProperty(id)) {
            instance.alarms[id].everyone = !instance.alarms[id].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordTools.sendSmartAlarmMessage(interaction.guildId, id, false, true, false, interaction);
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
    else if (interaction.customId.endsWith('SmartAlarmDelete')) {
        let id = interaction.customId.replace('SmartAlarmDelete', '');

        if (instance.alarms.hasOwnProperty(id)) {
            let messageId = instance.alarms[id].messageId;
            let message = await DiscordTools.getMessageById(guildId, instance.channelId.alarms, messageId);
            if (message !== undefined) {
                try {
                    await message.delete();
                }
                catch (e) {
                    client.log('ERROR', `Could not delete alarm message with id: ${messageId}.`, 'error');
                }
            }

            delete instance.alarms[id];
            client.writeInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardEveryone')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardEveryone', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            instance.storageMonitors[id].everyone = !instance.storageMonitors[id].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordTools.sendStorageMonitorMessage(interaction.guildId, id, false, true, false, interaction);
        }
    }
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardInGame')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardInGame', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            instance.storageMonitors[id].inGame = !instance.storageMonitors[id].inGame;
            client.writeInstanceFile(guildId, instance);

            await DiscordTools.sendStorageMonitorMessage(interaction.guildId, id, false, true, false, interaction);
        }
    }
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardDelete')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardDelete', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            delete instance.storageMonitors[id];
        }

        if (client.storageMonitorsMessages[guildId].hasOwnProperty(id)) {
            try {
                await client.storageMonitorsMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete storage monitor message with id: ${id}.`, 'error');
            }
            delete client.storageMonitorsMessages[guildId][id];
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('StorageMonitorContainerDelete')) {
        let id = interaction.customId.replace('StorageMonitorContainerDelete', '');

        if (instance.storageMonitors.hasOwnProperty(id)) {
            delete instance.storageMonitors[id];
        }

        if (client.storageMonitorsMessages[guildId].hasOwnProperty(id)) {
            try {
                await client.storageMonitorsMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete storage monitor message with id: ${id}.`, 'error');
            }
            delete client.storageMonitorsMessages[guildId][id];
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('TurnOnGroup') ||
        interaction.customId.endsWith('TurnOffGroup')) {
        let id = interaction.customId.replace('TurnOnGroup', '');
        id = id.replace('TurnOffGroup', '');

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

        let active = (interaction.customId.endsWith('TurnOnGroup') ? true : false);

        await SmartSwitchGroupHandler.TurnOnOffGroup(
            client, rustplus, interaction.guildId, rustplus.serverId, id, active);
    }
    else if (interaction.customId.endsWith('DeleteGroup')) {
        let id = interaction.customId.replace('DeleteGroup', '');

        if (!rustplus) {
            client.log('ERROR', 'Rustplus is not connected, cannot delete the Smart Switch Group...', 'error');
            return;
        }

        if (instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(id)) {
            delete instance.serverList[rustplus.serverId].switchGroups[id];
        }

        if (client.switchesMessages[guildId].hasOwnProperty(id)) {
            try {
                await client.switchesMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
            }
            delete client.switchesMessages[guildId][id];
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('TrackerActive')) {
        let trackerName = interaction.customId.replace('TrackerActive', '');

        if (instance.trackers.hasOwnProperty(trackerName)) {
            instance.trackers[trackerName].active = !instance.trackers[trackerName].active;
            client.writeInstanceFile(guildId, instance);

            await DiscordTools.sendTrackerMessage(interaction.guildId, trackerName, false, true, interaction);
        }
    }
    else if (interaction.customId.endsWith('TrackerEveryone')) {
        let trackerName = interaction.customId.replace('TrackerEveryone', '');

        if (instance.trackers.hasOwnProperty(trackerName)) {
            instance.trackers[trackerName].everyone = !instance.trackers[trackerName].everyone;
            client.writeInstanceFile(guildId, instance);

            await DiscordTools.sendTrackerMessage(interaction.guildId, trackerName, false, true, interaction);
        }
    }
    else if (interaction.customId.endsWith('TrackerDelete')) {
        let trackerName = interaction.customId.replace('TrackerDelete', '');

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
