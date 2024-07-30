/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const Discord = require('discord.js');
const Path = require('path');

import { log } from '../../index';
import * as discordTools from './discord-tools';
import * as discordSelectMenus from './discord-select-menus';
import * as discordButtons from './discord-buttons';
import * as discordEmbeds from './discord-embeds';
import * as constants from '../util/constants';
const Client = require('../../index.ts');
const Request = require('../util/request.ts');

module.exports = {
    sendMessage: async function (guildId, content, messageId, channelId, interaction = null) {
        if (interaction) {
            await discordTools.interactionUpdate(interaction, content);
            return;
        }

        let message = messageId !== null ?
            await discordTools.getMessage(Client.client, guildId, channelId, messageId) : undefined;

        if (message !== undefined) {
            return await discordTools.messageEdit(message, content);
        }
        else {
            const channel = await discordTools.getTextChannel(Client.client, guildId, channelId);

            if (!channel) {
                log.error(Client.client.intlGet(null, 'couldNotGetChannelWithId', { id: channelId }));
                return;
            }

            return await discordTools.messageSend(channel, content);
        }
    },

    sendServerMessage: async function (guildId, serverId, state = null, interaction = null) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];

        const content = {
            embeds: [await discordEmbeds.getServerEmbed(Client.client, guildId, serverId)],
            components: discordButtons.getServerButtons(Client.client, guildId, serverId, state)
        }

        const message = await module.exports.sendMessage(guildId, content, server.messageId,
            instance.channelIds.servers, interaction);

        if (!interaction) {
            instance.serverList[serverId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendTrackerMessage: async function (guildId, trackerId, interaction = null) {
        const instance = Client.client.getInstance(guildId);
        const tracker = instance.trackers[trackerId];

        const content = {
            embeds: [discordEmbeds.getTrackerEmbed(Client.client, guildId, trackerId)],
            components: discordButtons.getTrackerButtons(guildId, trackerId)
        }

        const message = await module.exports.sendMessage(guildId, content, tracker.messageId,
            instance.channelIds.trackers, interaction);

        if (!interaction) {
            instance.trackers[trackerId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendSmartSwitchMessage: async function (guildId, serverId, entityId, interaction = null) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].switches[entityId];

        const content = {
            embeds: [entity.reachable ?
                discordEmbeds.getSmartSwitchEmbed(guildId, serverId, entityId) :
                discordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'switches')],
            components: [
                discordSelectMenus.getSmartSwitchSelectMenu(guildId, serverId, entityId),
                discordButtons.getSmartSwitchButtons(guildId, serverId, entityId)
            ],
            files: [
                new Discord.AttachmentBuilder(Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))
            ]
        }

        const message = await module.exports.sendMessage(guildId, content, entity.messageId,
            instance.channelIds.switches, interaction);

        if (!interaction) {
            instance.serverList[serverId].switches[entityId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendSmartAlarmMessage: async function (guildId, serverId, entityId, interaction = null) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];

        const content = {
            embeds: [entity.reachable ?
                discordEmbeds.getSmartAlarmEmbed(guildId, serverId, entityId) :
                discordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'alarms')],
            components: [discordButtons.getSmartAlarmButtons(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
        }

        const message = await module.exports.sendMessage(guildId, content, entity.messageId,
            instance.channelIds.alarms, interaction);

        if (!interaction) {
            instance.serverList[serverId].alarms[entityId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendStorageMonitorMessage: async function (guildId, serverId, entityId, interaction = null) {
        let instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];

        const content = {
            embeds: [entity.reachable ?
                discordEmbeds.getStorageMonitorEmbed(Client.client, guildId, serverId, entityId) :
                discordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'storageMonitors')],
            components: [entity.type === 'toolCupboard' ?
                discordButtons.getStorageMonitorToolCupboardButtons(guildId, serverId, entityId) :
                discordButtons.getStorageMonitorContainerButton(guildId, serverId, entityId)],
            files: [
                new Discord.AttachmentBuilder(
                    Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
        }

        instance = Client.client.getInstance(guildId);

        const message = await module.exports.sendMessage(guildId, content, entity.messageId,
            instance.channelIds.storageMonitors, interaction);

        if (!interaction) {
            instance.serverList[serverId].storageMonitors[entityId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendSmartSwitchGroupMessage: async function (guildId, serverId, groupId, interaction = null) {
        const instance = Client.client.getInstance(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];

        const content = {
            embeds: [discordEmbeds.getSmartSwitchGroupEmbed(guildId, serverId, groupId)],
            components: discordButtons.getSmartSwitchGroupButtons(guildId, serverId, groupId),
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${group.image}`))]
        }

        const message = await module.exports.sendMessage(guildId, content, group.messageId,
            instance.channelIds.switchGroups, interaction);

        if (!interaction) {
            instance.serverList[serverId].switchGroups[groupId].messageId = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendStorageMonitorRecycleMessage: async function (guildId, serverId, entityId, items) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getStorageMonitorRecycleEmbed(Client.client, guildId, serverId, entityId, items)],
            components: [discordButtons.getRecycleDeleteButton()],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', 'resources/images/electrics/recycler.png'))]
        }

        return await module.exports.sendMessage(guildId, content, null, instance.channelIds.storageMonitors);
    },

    sendDecayingNotificationMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];

        const content = {
            embeds: [discordEmbeds.getDecayingNotificationEmbed(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
            content: entity.everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendStorageMonitorDisconnectNotificationMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];

        const content = {
            embeds: [discordEmbeds.getStorageMonitorDisconnectNotificationEmbed(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
            content: entity.everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendStorageMonitorNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];

        const content = {
            embeds: [await discordEmbeds.getStorageMonitorNotFoundEmbed(Client.client, guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
            content: entity.everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendSmartSwitchNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].switches[entityId];

        const content = {
            embeds: [await discordEmbeds.getSmartSwitchNotFoundEmbed(Client.client, guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendSmartAlarmNotFoundMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];

        const content = {
            embeds: [await discordEmbeds.getSmartAlarmNotFoundEmbed(Client.client, guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
            content: entity.everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendSmartAlarmTriggerMessage: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];

        const content = {
            embeds: [await discordEmbeds.getAlarmEmbed(guildId, serverId, entityId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
            content: entity.everyone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendServerChangeStateMessage: async function (guildId, serverId, state) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getServerChangedStateEmbed(guildId, serverId, state)]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendServerWipeDetectedMessage: async function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getServerWipeDetectedEmbed(guildId, serverId)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', '..', `maps/${guildId}_map_full.png`))],
            content: instance.generalSettings.mapWipeNotifyEveryone ? '@everyone' : ''
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendServerConnectionInvalidMessage: async function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getServerConnectionInvalidEmbed(guildId, serverId)]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendInformationMapMessage: async function (guildId) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', '..', `maps/${guildId}_map_full.png`))]
        }

        const message = await module.exports.sendMessage(guildId, content, instance.informationChannelMessageIds.map,
            instance.channelIds.information);

        if (message) {
            instance.informationChannelMessageIds.map = message.id;
            Client.client.setInstance(guildId, instance);
        }
    },

    sendDiscordEventMessage: async function (guildId, serverId, text, image, color) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getEventEmbed(guildId, serverId, text, image, color)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', `resources/images/events/${image}`))]
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.events);
    },

    sendActivityNotificationMessage: async function (guildId, serverId, color, text, steamId, title = null, everyone = false) {
        const instance = Client.client.getInstance(guildId);

        let png = null;
        if (steamId !== null) {
            png = await Request.requestSteamProfilePicture(steamId);
        }
        const content = {
            embeds: [discordEmbeds.getActivityNotificationEmbed(guildId, serverId, color, text, steamId, png, title)]
        }

        if (everyone) {
            content.content = '@everyone';
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendTeamChatMessage: async function (guildId, message) {
        const instance = Client.client.getInstance(guildId);

        let color = constants.COLOR_TEAMCHAT_DEFAULT;
        if (instance.teamChatColors.hasOwnProperty(message.steamId)) {
            color = instance.teamChatColors[message.steamId];
        }

        const content = {
            embeds: [discordEmbeds.getEmbed({
                color: discordEmbeds.colorHexToNumber(color),
                description: `**${message.name}**: ${message.message}`
            })]
        }

        if (message.message.includes('@everyone')) {
            content.content = '@everyone';
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.teamchat);
    },

    sendTTSMessage: async function (guildId, name, text) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            content: Client.client.intlGet(guildId, 'userSaid', { user: name, text: text }),
            tts: true
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.teamchat);
    },

    sendUpdateMapInformationMessage: async function (rustplus) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', '..', `maps/${rustplus.guildId}_map_full.png`))]
        }

        const message = await module.exports.sendMessage(rustplus.guildId, content,
            instance.informationChannelMessageIds.map, instance.channelIds.information);

        if (message.id !== instance.informationChannelMessageIds.map) {
            instance.informationChannelMessageIds.map = message.id;
            Client.client.setInstance(rustplus.guildId, instance);
        }
    },

    sendUpdateServerInformationMessage: async function (rustplus) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            embeds: [discordEmbeds.getUpdateServerInformationEmbed(rustplus)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', 'resources/images/server_info_logo.png')
            )]
        }

        const message = await module.exports.sendMessage(rustplus.guildId, content,
            instance.informationChannelMessageIds.server, instance.channelIds.information);

        if (message.id !== instance.informationChannelMessageIds.server) {
            instance.informationChannelMessageIds.server = message.id;
            Client.client.setInstance(rustplus.guildId, instance);
        }
    },

    sendUpdateEventInformationMessage: async function (rustplus) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            embeds: [discordEmbeds.getUpdateEventInformationEmbed(rustplus)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', 'resources/images/event_info_logo.png')
            )]
        }

        const message = await module.exports.sendMessage(rustplus.guildId, content,
            instance.informationChannelMessageIds.event, instance.channelIds.information);

        if (message.id !== instance.informationChannelMessageIds.event) {
            instance.informationChannelMessageIds.event = message.id;
            Client.client.setInstance(rustplus.guildId, instance);
        }
    },

    sendUpdateTeamInformationMessage: async function (rustplus) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            embeds: [discordEmbeds.getUpdateTeamInformationEmbed(rustplus)],
            files: [new Discord.AttachmentBuilder(
                Path.join(__dirname, '..', 'resources/images/team_info_logo.png')
            )]
        }

        const message = await module.exports.sendMessage(rustplus.guildId, content,
            instance.informationChannelMessageIds.team, instance.channelIds.information);

        if (message.id !== instance.informationChannelMessageIds.team) {
            instance.informationChannelMessageIds.team = message.id;
            Client.client.setInstance(rustplus.guildId, instance);
        }
    },

    sendUpdateBattlemetricsOnlinePlayersInformationMessage: async function (rustplus, battlemetricsId) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            embeds: [discordEmbeds.getUpdateBattlemetricsOnlinePlayersInformationEmbed(Client.client, rustplus,
                battlemetricsId)]
        }

        const message = await module.exports.sendMessage(rustplus.guildId, content,
            instance.informationChannelMessageIds.battlemetricsPlayers, instance.channelIds.information);

        if (message.id !== instance.informationChannelMessageIds.battlemetricsPlayers) {
            instance.informationChannelMessageIds.battlemetricsPlayers = message.id;
            Client.client.setInstance(rustplus.guildId, instance);
        }
    },

    sendDiscordCommandResponseMessage: async function (rustplus, client, message, response) {
        const content = {
            embeds: [discordEmbeds.getDiscordCommandResponseEmbed(rustplus, response)]
        }

        await discordTools.messageReply(message, content);
    },

    sendCredentialsShowMessage: async function (interaction) {
        const content = {
            embeds: [await discordEmbeds.getCredentialsShowEmbed(Client.client, interaction.guildId)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendItemAvailableInVendingMachineMessage: async function (rustplus, str) {
        const instance = Client.client.getInstance(rustplus.guildId);

        const content = {
            embeds: [discordEmbeds.getItemAvailableVendingMachineEmbed(
                rustplus.guildId, rustplus.serverId, str
            )]
        }

        await module.exports.sendMessage(rustplus.guildId, content, null, instance.channelIds.activity);
    },

    sendHelpMessage: async function (interaction) {
        const content = {
            embeds: [discordEmbeds.getHelpEmbed(interaction.guildId)],
            components: discordButtons.getHelpButtons(),
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendCctvMessage: async function (interaction, monument, cctvCodes, dynamic) {
        const content = {
            embeds: [discordEmbeds.getCctvEmbed(interaction.guildId, monument, cctvCodes, dynamic)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendUptimeMessage: async function (interaction, uptime) {
        const content = {
            embeds: [discordEmbeds.getUptimeEmbed(uptime)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendVoiceMessage: async function (interaction, state) {
        const content = {
            embeds: [discordEmbeds.getVoiceEmbed(state)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendCraftMessage: async function (interaction, craftDetails, quantity) {
        const content = {
            embeds: [discordEmbeds.getCraftEmbed(Client.client, interaction.guildId, craftDetails, quantity)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendResearchMessage: async function (interaction, researchDetails) {
        const content = {
            embeds: [discordEmbeds.getResearchEmbed(Client.client, interaction.guildId, researchDetails)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendRecycleMessage: async function (interaction, recycleDetails, quantity, recyclerType) {
        const content = {
            embeds: [discordEmbeds.getRecycleEmbed(Client.client, interaction.guildId, recycleDetails, quantity,
                recyclerType)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },

    sendBattlemetricsEventMessage: async function (guildId, battlemetricsId, title, description, fields = null, everyone = false) {
        const instance = Client.client.getInstance(guildId);

        const content = {
            embeds: [discordEmbeds.getBattlemetricsEventEmbed(Client.client, guildId, battlemetricsId, title,
                description, fields)]
        }

        if (everyone) {
            content.content = '@everyone';
        }

        await module.exports.sendMessage(guildId, content, null, instance.channelIds.activity);
    },

    sendItemMessage: async function (interaction, itemName, itemId, type) {
        const content = {
            embeds: [discordEmbeds.getItemEmbed(Client.client, interaction.guildId, itemName, itemId, type)],
            ephemeral: true
        }

        await discordTools.interactionEditReply(interaction, content);
    },
}