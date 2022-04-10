const DiscordTools = require('../discordTools/discordTools.js');

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

        await interaction.update({ components: [row] });

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

        await interaction.update({ components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'showTrademark') {
        instance.generalSettings.showTrademark = !instance.generalSettings.showTrademark;

        if (rustplus) {
            rustplus.generalSettings.showTrademark = instance.generalSettings.showTrademark;
        }

        let row = DiscordTools.getTrademarkButton(instance.generalSettings.showTrademark);

        await interaction.update({ components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'allowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;

        if (rustplus) {
            rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;
        }

        let row = DiscordTools.getInGameCommandsEnabledButton(instance.generalSettings.inGameCommandsEnabled);

        await interaction.update({ components: [row] });

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

        await interaction.update({ components: [row] });

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

        await interaction.update({ components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'smartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;

        if (rustplus) {
            rustplus.generalSettings.smartAlarmNotifyInGame = instance.generalSettings.smartAlarmNotifyInGame;
        }

        let row = DiscordTools.getSmartAlarmNotifyInGameButton(instance.generalSettings.smartAlarmNotifyInGame);

        await interaction.update({ components: [row] });

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('ServerConnect')) {
        let server = interaction.customId.replace('ServerConnect', '');

        for (const [key, value] of Object.entries(instance.serverList)) {
            if (value.active) {
                instance.serverList[key].active = false;
                client.writeInstanceFile(guildId, instance);
                await DiscordTools.sendServerMessage(guildId, key, null, false, true);
                break;
            }
        }

        instance = client.readInstanceFile(guildId);
        instance.serverList[server].active = true;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendServerMessage(guildId, server, null, false, true, interaction);

        /* Disconnect previous instance is any */
        if (rustplus) {
            rustplus.disconnect();
        }

        /* Create the rustplus instance */
        client.createRustplusInstance(
            guildId,
            instance.serverList[server].serverIp,
            instance.serverList[server].appPort,
            instance.serverList[server].steamId,
            instance.serverList[server].playerToken
        );

    }
    else if (interaction.customId.endsWith('ServerDisconnect') ||
        interaction.customId.endsWith('ServerReconnecting')) {
        let server = interaction.customId.replace('ServerDisconnect', '');
        server = server.replace('ServerReconnecting', '');

        instance.serverList[server].active = false;
        client.writeInstanceFile(guildId, instance);

        await DiscordTools.sendServerMessage(guildId, server, null, false, true, interaction);

        /* Disconnect previous instance if any */
        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.endsWith('ServerDelete')) {
        let server = interaction.customId.replace('ServerDelete', '');

        if (instance.serverList[server].active) {
            if (rustplus) {
                rustplus.disconnect();
                rustplus.deleted = true;
                delete client.rustplusInstances[guildId];
            }
        }

        let messageId = instance.serverList[server].messageId;
        let message = await DiscordTools.getMessageById(guildId, instance.channelId.servers, messageId);
        if (message !== undefined) {
            await message.delete();
        }

        delete instance.serverList[server];

        /* Remove all Smart Switches assosiated with this server */
        for (const [key, value] of Object.entries(instance.switches)) {
            if (`${value.ipPort}` === server) {
                delete instance.switches[key];
            }
        }
        if (rustplus && (server === `${rustplus.server}-${rustplus.port}`)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
        }

        /* Remove all Smart Alarms assosiated with this server */
        for (const [key, value] of Object.entries(instance.alarms)) {
            if (`${value.ipPort}` === server) {
                let messageId = instance.alarms[key].messageId;
                let message = await DiscordTools.getMessageById(
                    rustplus.guildId, instance.channelId.alarms, messageId);
                if (message !== undefined) {
                    await message.delete();
                }

                delete instance.alarms[key];
            }
        }

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('SmartSwitch')) {
        let id = interaction.customId.replace('OnSmartSwitch', '').replace('OffSmartSwitch', '');

        if (!instance.switches.hasOwnProperty(id)) {
            await client.switchesMessages[guildId][id].delete();
            delete client.switchesMessages[guildId][id];
            return;
        }

        if (!(rustplus &&
            instance.switches[id].ipPort === `${rustplus.server}-${rustplus.port}` &&
            rustplus.connected)) {
            client.log('ERROR', 'Rustplus is not connected, cannot use Smart Switches...', 'error')
            interaction.deferUpdate();
            return;
        }

        let active = (interaction.customId.endsWith('OnSmartSwitch')) ? true : false;

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

            await client.switchesMessages[rustplus.guildId][id].delete();
            delete client.switchesMessages[rustplus.guildId][id];
            return;
        }

        instance.switches[id].active = active;
        client.writeInstanceFile(guildId, instance);

        DiscordTools.sendSmartSwitchMessage(guildId, id, true, true, false, interaction);

        rustplus.interactionSwitches[id] = active;
    }
    else if (interaction.customId.endsWith('SmartSwitchDelete')) {
        let id = interaction.customId.replace('SmartSwitchDelete', '');

        delete instance.switches[id];

        await client.switchesMessages[guildId][id].delete();
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
            await message.delete();
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

        await client.storageMonitorsMessages[guildId][id].delete();
        delete client.storageMonitorsMessages[guildId][id];

        client.writeInstanceFile(guildId, instance);
    }
    else if (interaction.customId.endsWith('StorageMonitorContainerDelete')) {
        let id = interaction.customId.replace('StorageMonitorContainerDelete', '');

        delete instance.storageMonitors[id];

        await client.storageMonitorsMessages[guildId][id].delete();
        delete client.storageMonitorsMessages[guildId][id];

        client.writeInstanceFile(guildId, instance);
    }
}
