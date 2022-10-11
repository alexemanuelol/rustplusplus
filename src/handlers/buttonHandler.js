const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const DiscordButtons = require('../discordTools/discordButtons.js');
const DiscordModals = require('../discordTools/discordModals.js');
const Recycler = require('../util/recycler.js');

module.exports = async (client, interaction) => {
    const instance = client.getInstance(interaction.guildId);
    const guildId = interaction.guildId;
    const rustplus = client.rustplusInstances[guildId];

    if (interaction.customId.startsWith('DiscordNotification')) {
        const ids = JSON.parse(interaction.customId.replace('DiscordNotification', ''));
        const setting = instance.notificationSettings[ids.setting];

        setting.discord = !setting.discord;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.notificationSettings[ids.setting].discord = setting.discord;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getNotificationButtons(guildId, ids.setting, setting.discord, setting.inGame)]
        });
    }
    else if (interaction.customId.startsWith('InGameNotification')) {
        const ids = JSON.parse(interaction.customId.replace('InGameNotification', ''));
        const setting = instance.notificationSettings[ids.setting];

        setting.inGame = !setting.inGame;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.notificationSettings[ids.setting].inGame = setting.inGame;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getNotificationButtons(guildId, ids.setting, setting.discord, setting.inGame)]
        });
    }
    else if (interaction.customId === 'AllowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameCommandsEnabledButton(guildId,
                instance.generalSettings.inGameCommandsEnabled)]
        });
    }
    else if (interaction.customId === 'BotMutedInGame') {
        instance.generalSettings.muteInGameBotMessages = !instance.generalSettings.muteInGameBotMessages;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.muteInGameBotMessages = instance.generalSettings.muteInGameBotMessages;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getBotMutedInGameButton(guildId,
                instance.generalSettings.muteInGameBotMessages)]
        });
    }
    else if (interaction.customId === 'InGameTeammateConnection') {
        instance.generalSettings.connectionNotify = !instance.generalSettings.connectionNotify;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.connectionNotify = instance.generalSettings.connectionNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'InGameTeammateAfk') {
        instance.generalSettings.afkNotify = !instance.generalSettings.afkNotify;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.afkNotify = instance.generalSettings.afkNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'InGameTeammateDeath') {
        instance.generalSettings.deathNotify = !instance.generalSettings.deathNotify;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.deathNotify = instance.generalSettings.deathNotify;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotification') {
        instance.generalSettings.fcmAlarmNotificationEnabled = !instance.generalSettings.fcmAlarmNotificationEnabled;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEnabled =
            instance.generalSettings.fcmAlarmNotificationEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getFcmAlarmNotificationButtons(
                guildId,
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotificationEveryone') {
        instance.generalSettings.fcmAlarmNotificationEveryone = !instance.generalSettings.fcmAlarmNotificationEveryone;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEveryone =
            instance.generalSettings.fcmAlarmNotificationEveryone;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getFcmAlarmNotificationButtons(
                guildId,
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'SmartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.smartAlarmNotifyInGame =
            instance.generalSettings.smartAlarmNotifyInGame;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getSmartAlarmNotifyInGameButton(
                guildId,
                instance.generalSettings.smartAlarmNotifyInGame)]
        });
    }
    else if (interaction.customId === 'LeaderCommandEnabled') {
        instance.generalSettings.leaderCommandEnabled = !instance.generalSettings.leaderCommandEnabled;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.leaderCommandEnabled = instance.generalSettings.leaderCommandEnabled;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getLeaderCommandEnabledButton(
                guildId,
                instance.generalSettings.leaderCommandEnabled)]
        });
    }
    else if (interaction.customId === 'TrackerNotifyAllOffline') {
        instance.generalSettings.trackerNotifyAllOffline = !instance.generalSettings.trackerNotifyAllOffline;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.trackerNotifyAllOffline =
            instance.generalSettings.trackerNotifyAllOffline;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getTrackerNotifyButtons(
                guildId,
                instance.generalSettings.trackerNotifyAllOffline,
                instance.generalSettings.trackerNotifyAnyOnline)]
        });
    }
    else if (interaction.customId === 'TrackerNotifyAnyOnline') {
        instance.generalSettings.trackerNotifyAnyOnline = !instance.generalSettings.trackerNotifyAnyOnline;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.trackerNotifyAnyOnline =
            instance.generalSettings.trackerNotifyAnyOnline;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getTrackerNotifyButtons(
                guildId,
                instance.generalSettings.trackerNotifyAllOffline,
                instance.generalSettings.trackerNotifyAnyOnline)]
        });
    }
    else if (interaction.customId === 'MapWipeNotifyEveryone') {
        instance.generalSettings.mapWipeNotifyEveryone = !instance.generalSettings.mapWipeNotifyEveryone;
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.mapWipeNotifyEveryone =
            instance.generalSettings.mapWipeNotifyEveryone;

        await client.interactionUpdate(interaction, {
            components: [DiscordButtons.getMapWipeNotifyEveryoneButton(instance.generalSettings.mapWipeNotifyEveryone)]
        });
    }
    else if (interaction.customId.startsWith('ServerConnect')) {
        const ids = JSON.parse(interaction.customId.replace('ServerConnect', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        for (const [serverId, content] of Object.entries(instance.serverList)) {
            if (content.active) {
                instance.serverList[serverId].active = false;
                client.setInstance(guildId, instance);
                await DiscordMessages.sendServerMessage(guildId, serverId, null);
                break;
            }
        }

        server.active = true;
        client.setInstance(guildId, instance);
        await DiscordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);

        /* Disconnect previous instance is any */
        if (rustplus) rustplus.disconnect();

        /* Create the rustplus instance */
        const newRustplus = client.createRustplusInstance(
            guildId, server.serverIp, server.appPort, server.steamId, server.playerToken);

        newRustplus.isNewConnection = true;
    }
    else if (interaction.customId.startsWith('CustomTimersEdit')) {
        const ids = JSON.parse(interaction.customId.replace('CustomTimersEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getCustomTimersEditModal(guildId, ids.serverId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('CreateTracker')) {
        const ids = JSON.parse(interaction.customId.replace('CreateTracker', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        /* Find an available tracker id */
        const trackerId = client.findAvailableTrackerId(guildId);

        instance.trackers[trackerId] = {
            name: 'Tracker',
            serverId: ids.serverId,
            battlemetricsId: server.battlemetricsId,
            status: false,
            allOffline: true,
            messageId: null,
            active: true,
            everyone: false,
            inGame: true,
            players: [],
            img: server.img,
            title: server.title
        }
        client.setInstance(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, trackerId);
    }
    else if (interaction.customId.startsWith('CreateGroup')) {
        const ids = JSON.parse(interaction.customId.replace('CreateGroup', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        const groupId = client.findAvailableGroupId(guildId, ids.serverId);

        server.switchGroups[groupId] = {
            name: 'Group',
            command: `${groupId}`,
            switches: [],
            messageId: null
        }
        client.setInstance(guildId, instance);

        await DiscordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupId);
    }
    else if (interaction.customId.startsWith('ServerDisconnect') ||
        interaction.customId.startsWith('ServerReconnecting')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDisconnect', '')
            .replace('ServerReconnecting', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        server.active = false;
        client.setInstance(guildId, instance);

        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }

        await DiscordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);
    }
    else if (interaction.customId.startsWith('ServerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        if (rustplus && (rustplus.serverId === ids.serverId || server.active)) {
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
            await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.storageMonitors, 100);

            rustplus.disconnect();
            rustplus.isDeleted = true;
            delete client.rustplusInstances[guildId];
        }

        for (const [entityId, content] of Object.entries(server.alarms)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.alarms, content.messageId);
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.servers, server.messageId);

        delete instance.serverList[ids.serverId];
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartSwitchOn') ||
        interaction.customId.startsWith('SmartSwitchOff')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchOn', '').replace('SmartSwitchOff', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (!rustplus || (rustplus && (rustplus.serverId !== ids.serverId))) {
            interaction.deferUpdate();
            return;
        }

        clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
        delete rustplus.currentSwitchTimeouts[ids.entityId];

        const active = (interaction.customId.startsWith('SmartSwitchOn')) ? true : false;
        const prevActive = server.switches[ids.entityId].active;
        server.switches[ids.entityId].active = active;
        client.setInstance(guildId, instance);

        rustplus.interactionSwitches.push(ids.entityId);

        const response = await rustplus.turnSmartSwitchAsync(ids.entityId, active);
        if (!(await rustplus.isResponseValid(response))) {
            if (server.switches[ids.entityId].reachable) {
                await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, ids.serverId, ids.entityId);
            }
            server.switches[ids.entityId].reachable = false;
            server.switches[ids.entityId].active = prevActive;
            client.setInstance(guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== ids.entityId);
        }
        else {
            server.switches[ids.entityId].reachable = true;
            client.setInstance(guildId, instance);
        }

        DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(client, guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('SmartSwitchEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getSmartSwitchEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('SmartSwitchDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
            server.switches[ids.entityId].messageId);

        delete server.switches[ids.entityId];
        client.setInstance(guildId, instance);

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
            delete rustplus.currentSwitchTimeouts[ids.entityId];
        }

        for (const [groupId, content] of Object.entries(server.switchGroups)) {
            if (content.switches.includes(ids.entityId.toString())) {
                server.switchGroups[groupId].switches = content.switches.filter(e => e !== ids.entityId.toString());
                client.setInstance(guildId, instance);
                await DiscordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupId);
            }
        }
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartAlarmEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEveryone', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.alarms[ids.entityId].everyone = !server.alarms[ids.entityId].everyone;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendSmartAlarmMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('SmartAlarmDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.alarms,
            server.alarms[ids.entityId].messageId);

        delete server.alarms[ids.entityId];
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getSmartAlarmEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardEveryone', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.storageMonitors[ids.entityId].everyone = !server.storageMonitors[ids.entityId].everyone;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendStorageMonitorMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardInGame')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardInGame', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.storageMonitors[ids.entityId].inGame = !server.storageMonitors[ids.entityId].inGame;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendStorageMonitorMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('StorageMonitorEdit')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getStorageMonitorEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
            server.storageMonitors[ids.entityId].messageId);

        delete server.storageMonitors[ids.entityId];
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId.startsWith('StorageMonitorRecycle')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorRecycle', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        if (!rustplus || (rustplus && rustplus.serverId !== ids.serverId)) return;

        const entityInfo = await rustplus.getEntityInfoAsync(ids.entityId);
        if (!(await rustplus.isResponseValid(entityInfo))) return;

        server.storageMonitors[ids.entityId].reachable = true;
        client.setInstance(guildId, instance);

        const items = Recycler.calculate(entityInfo.entityInfo.payload.items);

        const message = await DiscordMessages.sendStorageMonitorRecycleMessage(
            guildId, ids.serverId, ids.entityId, items);

        setTimeout(async () => {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors, message.id);
        }, 30000);
    }
    else if (interaction.customId.startsWith('StorageMonitorContainerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorContainerDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.storageMonitors,
            server.storageMonitors[ids.entityId].messageId);

        delete server.storageMonitors[ids.entityId];
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId === 'RecycleDelete') {
        await interaction.message.delete();
    }
    else if (interaction.customId.startsWith('GroupTurnOn') ||
        interaction.customId.startsWith('GroupTurnOff')) {
        const ids = JSON.parse(interaction.customId.replace('GroupTurnOn', '').replace('GroupTurnOff', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.group]);
            delete rustplus.currentSwitchTimeouts[ids.group];

            if (rustplus.serverId === ids.serverId) {
                const active = (interaction.customId.startsWith('GroupTurnOn') ? true : false);

                await SmartSwitchGroupHandler.TurnOnOffGroup(
                    client, rustplus, guildId, ids.serverId, ids.groupId, active);
            }
        }
    }
    else if (interaction.customId.startsWith('GroupEdit')) {
        const ids = JSON.parse(interaction.customId.replace('GroupEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getGroupEditModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupDelete')) {
        const ids = JSON.parse(interaction.customId.replace('GroupDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.groupId]);
            delete rustplus.currentSwitchTimeouts[ids.groupId];
        }

        if (server.switchGroups.hasOwnProperty(ids.groupId)) {
            await DiscordTools.deleteMessageById(guildId, instance.channelId.switches,
                server.switchGroups[ids.groupId].messageId);

            delete server.switchGroups[ids.groupId];
            client.setInstance(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('GroupAddSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupAddSwitch', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getGroupAddSwitchModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupRemoveSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupRemoveSwitch', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getGroupRemoveSwitchModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerActive')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerActive', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        tracker.active = !tracker.active;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }
    else if (interaction.customId.startsWith('TrackerEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEveryone', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        tracker.everyone = !tracker.everyone;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }
    else if (interaction.customId.startsWith('TrackerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEdit', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getTrackerEditModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerDelete', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        await DiscordTools.deleteMessageById(guildId, instance.channelId.trackers,
            tracker.messageId);

        delete instance.trackers[ids.trackerId];
        client.setInstance(guildId, instance);
    }
    else if (interaction.customId.startsWith('TrackerAddPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayer', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getTrackerAddPlayerModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayer', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = DiscordModals.getTrackerRemovePlayerModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerInGame')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerInGame', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        tracker.inGame = !tracker.inGame;
        client.setInstance(guildId, instance);

        await DiscordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }
}
