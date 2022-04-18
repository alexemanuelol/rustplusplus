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
    else if (interaction.customId === 'showTrademark') {
        instance.generalSettings.showTrademark = !instance.generalSettings.showTrademark;

        if (rustplus) {
            rustplus.generalSettings.showTrademark = instance.generalSettings.showTrademark;
        }

        let row = DiscordTools.getTrademarkButton(instance.generalSettings.showTrademark);

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
            rustplus.generalSettings.fcmAlarmNotificationEveryone = instance.generalSettings.fcmAlarmNotificationEveryone;
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
    else if (interaction.customId === 'updateMapInformation') {
        instance.generalSettings.updateMapInformation = !instance.generalSettings.updateMapInformation;

        if (rustplus) {
            rustplus.generalSettings.updateMapInformation = instance.generalSettings.updateMapInformation;

            if (!rustplus.generalSettings.updateMapInformation) {
                let channelId = instance.channelId.information;
                let messageId = instance.informationMessageId.map;
                let message = undefined;
                if (messageId !== null) {
                    message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
                    instance.informationMessageId.map = null;
                    if (message !== undefined) {
                        try {
                            await message.delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete map message with id: ${messageId}.`, 'error');
                        }
                    }
                }
            }
        }

        let row = DiscordTools.getUpdateMapInformationButton(instance.generalSettings.updateMapInformation);

        await client.interactionUpdate(interaction, { components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('ServerConnect')) {
        let serverId = interaction.customId.replace('ServerConnect', '');

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
    else if (interaction.customId.endsWith('ServerDisconnect') ||
        interaction.customId.endsWith('ServerReconnecting')) {
        let serverId = interaction.customId.replace('ServerDisconnect', '');
        serverId = serverId.replace('ServerReconnecting', '');

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

        /* Remove all Smart Switches assosiated with this server */
        for (const [key, value] of Object.entries(instance.switches)) {
            if (`${value.serverId}` === serverId) {
                delete instance.switches[key];
            }
        }
        if (rustplus && (serverId === rustplus.serverId)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
        }

        /* Remove all Smart Alarms assosiated with this server */
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

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('SmartSwitch')) {
        let id = interaction.customId.replace('OnSmartSwitch', '').replace('OffSmartSwitch', '');

        if (!instance.switches.hasOwnProperty(id)) {
            try {
                await client.switchesMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
            }
            delete client.switchesMessages[guildId][id];
            return;
        }

        if (!(rustplus &&
            instance.switches[id].serverId === rustplus.serverId && rustplus.connected)) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                client.log('ERROR', 'Could not defer the interaction.', 'error')
            }
            client.log('ERROR', 'Rustplus is not connected, cannot use Smart Switches...', 'error')
            return;
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
            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, id);

            delete instance.switches[id];
            client.writeInstanceFile(rustplus.guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);

            try {
                await client.switchesMessages[rustplus.guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
            }
            delete client.switchesMessages[rustplus.guildId][id];
            return;
        }

        DiscordTools.sendSmartSwitchMessage(guildId, id, true, true, false, interaction);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
            client, interaction.guildId, instance.switches[id].serverId, id);
    }
    else if (interaction.customId.endsWith('SmartSwitchDelete')) {
        let id = interaction.customId.replace('SmartSwitchDelete', '');

        delete instance.switches[id];

        try {
            await client.switchesMessages[guildId][id].delete();
        }
        catch (e) {
            client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
        }
        delete client.switchesMessages[guildId][id];

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('SmartAlarmEveryone')) {
        let id = interaction.customId.replace('SmartAlarmEveryone', '');

        instance.alarms[id].everyone = !instance.alarms[id].everyone;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendSmartAlarmMessage(interaction.guildId, id, false, true, false, interaction);
    }
    else if (interaction.customId.endsWith('SmartAlarmDelete')) {
        let id = interaction.customId.replace('SmartAlarmDelete', '');

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
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardEveryone')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardEveryone', '');

        instance.storageMonitors[id].everyone = !instance.storageMonitors[id].everyone;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendStorageMonitorMessage(interaction.guildId, id, false, true, false, interaction);
    }
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardInGame')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardInGame', '');

        instance.storageMonitors[id].inGame = !instance.storageMonitors[id].inGame;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendStorageMonitorMessage(interaction.guildId, id, false, true, false, interaction);
    }
    else if (interaction.customId.endsWith('StorageMonitorToolCupboardDelete')) {
        let id = interaction.customId.replace('StorageMonitorToolCupboardDelete', '');

        delete instance.storageMonitors[id];

        try {
            await client.storageMonitorsMessages[guildId][id].delete();
        }
        catch (e) {
            client.log('ERROR', `Could not delete storage monitor message with id: ${id}.`, 'error');
        }
        delete client.storageMonitorsMessages[guildId][id];

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('StorageMonitorContainerDelete')) {
        let id = interaction.customId.replace('StorageMonitorContainerDelete', '');

        delete instance.storageMonitors[id];

        try {
            await client.storageMonitorsMessages[guildId][id].delete();
        }
        catch (e) {
            client.log('ERROR', `Could not delete storage monitor message with id: ${id}.`, 'error');
        }
        delete client.storageMonitorsMessages[guildId][id];

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
            client.log('ERROR', 'Rustplus is not connected, cannot use Smart Switch Groups...', 'error')
            return false;
        }

        let active = (interaction.customId.endsWith('TurnOnGroup') ? true : false);

        await SmartSwitchGroupHandler.TurnOnOffGroup(
            client, rustplus, interaction.guildId, rustplus.serverId, id, active);
    }
    else if (interaction.customId.endsWith('DeleteGroup')) {
        let id = interaction.customId.replace('DeleteGroup', '');

        delete instance.serverList[rustplus.serverId].switchGroups[id];

        try {
            await client.switchesMessages[guildId][id].delete();
        }
        catch (e) {
            client.log('ERROR', `Could not delete switch message with id: ${id}.`, 'error');
        }
        delete client.switchesMessages[guildId][id];

        client.writeInstanceFile(guildId, instance);
    }
}
