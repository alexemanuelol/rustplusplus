const Discord = require('discord.js');

const Client = require('../../index.js');
const DiscordButtons = require('./discordButtons.js');
const DiscordEmbeds = require('./discordEmbeds.js');
const DiscordSelectMenus = require('./discordSelectMenus.js');
const DiscordTools = require('./discordTools.js');

module.exports = {
    sendMessage: async function (guildId, content, messageId, channelId, interaction = null) {
        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        let message = messageId !== null ?
            await DiscordTools.getMessageById(guildId, channelId, messageId) : undefined;

        if (message !== undefined) {
            return await Client.client.messageEdit(message, content);
        }
        else {
            const channel = DiscordTools.getTextChannelById(guildId, channelId);

            if (!channel) {
                Client.client.log('ERROR', `Could not get channel with id: ${channelId}.`, 'error');
                return;
            }

            return await Client.client.messageSend(channel, content);
        }
    },

    sendServerMessage: async function (guildId, id, state = null, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getServerEmbed(guildId, id)],
            components: [DiscordButtons.getServerButtons(guildId, id, state)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.serverList[id].messageId, instance.channelId.servers, interaction);

        if (!interaction) {
            instance.serverList[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendTrackerMessage: async function (guildId, trackerName, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerEmbed(guildId, trackerName)],
            components: [DiscordButtons.getTrackerButtons(guildId, trackerName)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.trackers[trackerName].messageId, instance.channelId.trackers, interaction);

        if (!interaction) {
            instance.trackers[trackerName].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartSwitchMessage: async function (guildId, id, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.switches[id].reachable ?
                DiscordEmbeds.getSmartSwitchEmbed(guildId, id) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'switches')],
            components: [
                DiscordSelectMenus.getSmartSwitchSelectMenu(guildId, id),
                DiscordButtons.getSmartSwitchButtons(guildId, id)
            ],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`)
            ]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.switches[id].messageId, instance.channelId.switches, interaction);

        if (!interaction) {
            instance.switches[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartAlarmMessage: async function (guildId, id, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.alarms[id].reachable ?
                DiscordEmbeds.getSmartAlarmEmbed(guildId, id) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'alarms')],
            components: [DiscordButtons.getSmartAlarmButtons(guildId, id)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.alarms[id].image}`)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.alarms[id].messageId, instance.channelId.alarms, interaction);

        if (!interaction) {
            instance.alarms[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendStorageMonitorMessage: async function (guildId, id, interaction = null) {
        let instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.storageMonitors[id].reachable ?
                DiscordEmbeds.getStorageMonitorEmbed(guildId, id) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'storageMonitors')],
            components: [instance.storageMonitors[id].type === 'toolcupboard' ?
                DiscordButtons.getStorageMonitorToolCupboardButtons(guildId, id) :
                DiscordButtons.getStorageMonitorContainerButton(id)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`)]
        }

        instance = Client.client.readInstanceFile(guildId);

        const message = await module.exports.sendMessage(
            guildId, content, instance.storageMonitors[id].messageId, instance.channelId.storageMonitors, interaction);

        if (!interaction) {
            instance.storageMonitors[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendDecayingNotification: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getDecayingNotificationEmbed(guildId, id)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`)],
            content: instance.storageMonitors[id].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendStorageMonitorDisconnectNotification: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getStorageMonitorDisconnectNotificationEmbed(guildId, id)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`)],
            content: instance.storageMonitors[id].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendStorageMonitorNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getStorageMonitorNotFoundEmbed(guildId, id)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`)],
            content: instance.storageMonitors[id].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendSmartSwitchNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getSmartSwitchNotFoundEmbed(guildId, id)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`)]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendSmartAlarmNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getSmartAlarmNotFoundEmbed(guildId, id)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.alarms[id].image}`)],
            content: instance.alarms[id].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendTrackerAllOffline: async function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerAllOfflineEmbed(guildId, trackerName)],
            content: instance.trackers[trackerName].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },
}