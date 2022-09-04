const Discord = require('discord.js');

const Client = require('../../index.ts');
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

    sendServerMessage: async function (guildId, serverId, state = null, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getServerEmbed(guildId, serverId)],
            components: [DiscordButtons.getServerButtons(guildId, serverId, state)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.serverList[serverId].messageId, instance.channelId.servers, interaction);

        if (!interaction) {
            instance.serverList[serverId].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendTrackerMessage: async function (guildId, trackerId, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerEmbed(guildId, trackerId)],
            components: DiscordButtons.getTrackerButtons(guildId, trackerId)
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.trackers[trackerId].messageId, instance.channelId.trackers, interaction);

        if (!interaction) {
            instance.trackers[trackerId].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartSwitchMessage: async function (guildId, serverId, entityId, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.serverList[serverId].switches[entityId].reachable ?
                DiscordEmbeds.getSmartSwitchEmbed(guildId, serverId, entityId) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'switches')],
            components: [
                DiscordSelectMenus.getSmartSwitchSelectMenu(guildId, serverId, entityId),
                DiscordButtons.getSmartSwitchButtons(guildId, serverId, entityId)
            ],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                    `${instance.serverList[serverId].switches[entityId].image}`)
            ]
        }

        const message = await module.exports.sendMessage(guildId, content,
            instance.serverList[serverId].switches[entityId].messageId, instance.channelId.switches, interaction);

        if (!interaction) {
            instance.serverList[serverId].switches[entityId].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartAlarmMessage: async function (guildId, serverId, entityId, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.serverList[serverId].alarms[entityId].reachable ?
                DiscordEmbeds.getSmartAlarmEmbed(guildId, serverId, entityId) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'alarms')],
            components: [DiscordButtons.getSmartAlarmButtons(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                `${instance.serverList[serverId].alarms[entityId].image}`)]
        }

        const message = await module.exports.sendMessage(guildId, content,
            instance.serverList[serverId].alarms[entityId].messageId, instance.channelId.alarms, interaction);

        if (!interaction) {
            instance.serverList[serverId].alarms[entityId].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendStorageMonitorMessage: async function (guildId, serverId, entityId, interaction = null) {
        let instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.serverList[serverId].storageMonitors[entityId].reachable ?
                DiscordEmbeds.getStorageMonitorEmbed(guildId, serverId, entityId) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'storageMonitors')],
            components: [instance.serverList[serverId].storageMonitors[entityId].type === 'toolcupboard' ?
                DiscordButtons.getStorageMonitorToolCupboardButtons(guildId, serverId, entityId) :
                DiscordButtons.getStorageMonitorContainerButton(serverId, entityId)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                    `${instance.serverList[serverId].storageMonitors[entityId].image}`)]
        }

        instance = Client.client.readInstanceFile(guildId);

        const message = await module.exports.sendMessage(guildId, content,
            instance.serverList[serverId].storageMonitors[entityId].messageId,
            instance.channelId.storageMonitors, interaction);

        if (!interaction) {
            instance.serverList[serverId].storageMonitors[entityId].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartSwitchGroupMessage: async function (guildId, serverId, groupName, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getSmartSwitchGroupEmbed(guildId, serverId, groupName)],
            components: DiscordButtons.getSmartSwitchGroupButtons(serverId, groupName),
            files: [new Discord.AttachmentBuilder('src/resources/images/electrics/smart_switch.png')]
        }

        const message = await module.exports.sendMessage(guildId, content,
            instance.serverList[serverId].switchGroups[groupName].messageId,
            instance.channelId.switches, interaction);

        if (!interaction) {
            instance.serverList[serverId].switchGroups[groupName].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendDecayingNotificationMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getDecayingNotificationEmbed(guildId, serverId, entityId)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                    `${instance.serverList[serverId].storageMonitors[entityId].image}`)],
            content: instance.serverList[serverId].storageMonitors[entityId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendStorageMonitorDisconnectNotificationMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getStorageMonitorDisconnectNotificationEmbed(guildId, serverId, entityId)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                    `${instance.serverList[serverId].storageMonitors[entityId].image}`)],
            content: instance.serverList[serverId].storageMonitors[entityId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendStorageMonitorNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getStorageMonitorNotFoundEmbed(guildId, serverId, entityId)],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                    `${instance.serverList[serverId].storageMonitors[entityId].image}`)],
            content: instance.serverList[serverId].storageMonitors[entityId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendSmartSwitchNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getSmartSwitchNotFoundEmbed(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                `${instance.serverList[serverId].switches[entityId].image}`)]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendSmartAlarmNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [await DiscordEmbeds.getSmartAlarmNotFoundEmbed(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/` +
                `${instance.serverList[serverId].alarms[entityId].image}`)],
            content: instance.serverList[serverId].alarms[entityId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendTrackerAllOfflineMessage: async function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerAllOfflineEmbed(guildId, trackerId)],
            content: instance.trackers[trackerId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },

    sendTrackerAnyOnlineMessage: async function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerAnyOnlineEmbed(guildId, trackerId)],
            content: instance.trackers[trackerId].everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelId.activity);
    },
}