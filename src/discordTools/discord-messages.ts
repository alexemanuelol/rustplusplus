/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';
import * as path from 'path';

import { localeManager as lm } from '../../index';
import { requestSteamProfilePicture } from '../util/request';
import * as guildInstance from '../util/guild-instance';
import * as discordTools from './discord-tools';
import * as discordButtons from './discord-buttons';
import * as discordEmbeds from './discord-embeds';
import * as discordSelectMenus from './discord-select-menus';
import * as constants from '../util/constants';
const { RustPlus } = require('../structures/RustPlus');

export async function sendServerMessage(guildId: string, serverId: string, state: number | null = null,
    interaction: discordjs.Interaction | null = null) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const server = instance.serverList[serverId];

    const content = {
        embeds: [await discordEmbeds.getServerEmbed(guildId, serverId)],
        components: discordButtons.getServerButtons(guildId, serverId, state)
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.servers,
        server.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.serverList[serverId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendTrackerMessage(guildId: string, trackerId: string,
    interaction: discordjs.Interaction | null = null) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const tracker = instance.trackers[trackerId];

    const content = {
        embeds: [discordEmbeds.getTrackerEmbed(guildId, trackerId)],
        components: discordButtons.getTrackerButtons(guildId, trackerId)
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.trackers,
        tracker.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.trackers[trackerId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendSmartSwitchMessage(guildId: string, serverId: string, entityId: string,
    interaction: discordjs.Interaction | null = null) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
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
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))
        ]
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.switches,
        entity.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.serverList[serverId].switches[entityId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendSmartAlarmMessage(guildId: string, serverId: string, entityId: string,
    interaction: discordjs.Interaction | null = null) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].alarms[entityId];

    const content = {
        embeds: [entity.reachable ?
            discordEmbeds.getSmartAlarmEmbed(guildId, serverId, entityId) :
            discordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'alarms')],
        components: [discordButtons.getSmartAlarmButtons(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.alarms,
        entity.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.serverList[serverId].alarms[entityId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendStorageMonitorMessage(guildId: string, serverId: string, entityId: string,
    interaction: discordjs.Interaction | null = null) {
    let instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].storageMonitors[entityId];

    const content = {
        embeds: [entity.reachable ?
            discordEmbeds.getStorageMonitorEmbed(guildId, serverId, entityId) :
            discordEmbeds.getNotFoundSmartDeviceEmbed(guildId, serverId, entityId, 'storageMonitors')],
        components: [entity.type === 'toolCupboard' ?
            discordButtons.getStorageMonitorToolCupboardButtons(guildId, serverId, entityId) :
            discordButtons.getStorageMonitorContainerButton(guildId, serverId, entityId)],
        files: [
            new discordjs.AttachmentBuilder(
                path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
    }

    instance = guildInstance.readGuildInstanceFile(guildId);

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.storageMonitors,
        entity.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.serverList[serverId].storageMonitors[entityId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendSmartSwitchGroupMessage(guildId: string, serverId: string, groupId: string,
    interaction: discordjs.Interaction | null = null) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const group = instance.serverList[serverId].switchGroups[groupId];

    const content = {
        embeds: [discordEmbeds.getSmartSwitchGroupEmbed(guildId, serverId, groupId)],
        components: discordButtons.getSmartSwitchGroupButtons(guildId, serverId, groupId),
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${group.image}`))]
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.switchGroups,
        group.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        instance.serverList[serverId].switchGroups[groupId].messageId = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendStorageMonitorRecycleMessage(guildId: string, serverId: string, entityId: string, items: any): Promise<discordjs.Message | undefined> {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getStorageMonitorRecycleEmbed(guildId, serverId, entityId, items)],
        components: [discordButtons.getRecycleDeleteButton()],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/electrics/recycler.png'))]
    }

    return await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.storageMonitors);
}

export async function sendDecayingNotificationMessage(guildId: string, serverId: string, entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].storageMonitors[entityId];

    const content = {
        embeds: [discordEmbeds.getDecayingNotificationEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
        content: entity.everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendStorageMonitorDisconnectNotificationMessage(guildId: string, serverId: string,
    entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].storageMonitors[entityId];

    const content = {
        embeds: [discordEmbeds.getStorageMonitorDisconnectNotificationEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
        content: entity.everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendStorageMonitorNotFoundMessage(guildId: string, serverId: string, entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].storageMonitors[entityId];

    const content = {
        embeds: [await discordEmbeds.getStorageMonitorNotFoundEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
        content: entity.everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendSmartSwitchNotFoundMessage(guildId: string, serverId: string, entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].switches[entityId];

    const content = {
        embeds: [await discordEmbeds.getSmartSwitchNotFoundEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))]
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendSmartAlarmNotFoundMessage(guildId: string, serverId: string, entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].alarms[entityId];

    const content = {
        embeds: [await discordEmbeds.getSmartAlarmNotFoundEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
        content: entity.everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendSmartAlarmTriggerMessage(guildId: string, serverId: string, entityId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const entity = instance.serverList[serverId].alarms[entityId];

    const content = {
        embeds: [discordEmbeds.getAlarmEmbed(guildId, serverId, entityId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/electrics/${entity.image}`))],
        content: entity.everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendServerChangeStateMessage(guildId: string, serverId: string, state: number) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getServerChangedStateEmbed(guildId, serverId, state)]
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendServerWipeDetectedMessage(guildId: string, serverId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getServerWipeDetectedEmbed(guildId, serverId)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', '..', `maps/${guildId}_map_full.png`))],
        content: instance.generalSettings.mapWipeNotifyEveryone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendServerConnectionInvalidMessage(guildId: string, serverId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getServerConnectionInvalidEmbed(guildId, serverId)]
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendInformationMapMessage(guildId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', '..', `maps/${guildId}_map_full.png`))]
    }

    const message = await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.map);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.map = message.id;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

export async function sendDiscordEventMessage(guildId: string, serverId: string, text: string, image: string,
    color: string = constants.COLOR_DEFAULT) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getEventEmbed(guildId, serverId, text, image, color)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', `resources/images/events/${image}`))]
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.events);
}

export async function sendActivityNotificationMessage(guildId: string, serverId: string, color: string, text: string,
    steamId: string, title: string | null = null, everyone: boolean = false) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    let png = null;
    if (steamId !== null) {
        png = await requestSteamProfilePicture(steamId);
    }
    const content = {
        embeds: [discordEmbeds.getActivityNotificationEmbed(guildId, serverId, color, text, steamId,
            png as string, title)],
        content: everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendTeamChatMessage(guildId: string, message: any) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    let color = constants.COLOR_TEAMCHAT_DEFAULT;
    if (instance.teamChatColors.hasOwnProperty(message.steamId)) {
        color = instance.teamChatColors[message.steamId];
    }

    const content = {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(color),
            description: `**${message.name}**: ${message.message}`
        })],
        content: message.message.includes('@everyone') ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.teamchat);
}

export async function sendTTSMessage(guildId: string, name: string, text: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const content = {
        content: lm.getIntl(language, 'userSaid', { user: name, text: text }),
        tts: true
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.teamchat);
}

export async function sendUpdateMapInformationMessage(rustplus: typeof RustPlus) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', '..', `maps/${rustplus.guildId}_map_full.png`))]
    }

    const message = await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.map);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.map = message.id;
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }
}

export async function sendUpdateServerInformationMessage(rustplus: typeof RustPlus) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        embeds: [discordEmbeds.getUpdateServerInformationEmbed(rustplus)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/server_info_logo.png')
        )]
    }

    const message = await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.server);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.server = message.id;
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }
}

export async function sendUpdateEventInformationMessage(rustplus: typeof RustPlus) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        embeds: [discordEmbeds.getUpdateEventInformationEmbed(rustplus)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/event_info_logo.png')
        )]
    }

    const message = await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.event);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.event = message.id;
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }
}

export async function sendUpdateTeamInformationMessage(rustplus: typeof RustPlus) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        embeds: [discordEmbeds.getUpdateTeamInformationEmbed(rustplus)],
        files: [new discordjs.AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/team_info_logo.png')
        )]
    }

    const message = await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.team);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.team = message.id;
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }
}

export async function sendUpdateBattlemetricsOnlinePlayersInformationMessage(rustplus: typeof RustPlus,
    battlemetricsId: string) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        embeds: [discordEmbeds.getUpdateBattlemetricsOnlinePlayersInformationEmbed(rustplus, battlemetricsId)]
    }

    const message = await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.information,
        instance.informationChannelMessageIds.battlemetricsPlayers);

    if (message instanceof discordjs.Message) {
        instance.informationChannelMessageIds.battlemetricsPlayers = message.id;
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }
}

export async function sendDiscordCommandResponseMessage(rustplus: typeof RustPlus, message: discordjs.Message,
    response: string | string[]) {
    const content = {
        embeds: [discordEmbeds.getDiscordCommandResponseEmbed(rustplus, response)]
    }

    await discordTools.messageReply(message, content);
}

export async function sendCredentialsShowMessage(interaction: discordjs.Interaction) {
    const content = {
        embeds: [await discordEmbeds.getCredentialsShowEmbed(interaction.guildId as string)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendItemAvailableInVendingMachineMessage(rustplus: typeof RustPlus, str: string) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);

    const content = {
        embeds: [discordEmbeds.getItemAvailableVendingMachineEmbed(rustplus.guildId, rustplus.serverId, str)]
    }

    await discordTools.sendUpdateMessage(rustplus.guildId, content, instance.channelIds.activity);
}

export async function sendHelpMessage(interaction: discordjs.Interaction) {
    const content = {
        embeds: [discordEmbeds.getHelpEmbed(interaction.guildId as string)],
        components: discordButtons.getHelpButtons(),
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendCctvMessage(interaction: discordjs.Interaction, monument: string, cctvCodes: string[],
    dynamic: boolean) {
    const content = {
        embeds: [discordEmbeds.getCctvEmbed(interaction.guildId as string, monument, cctvCodes, dynamic)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendUptimeMessage(interaction: discordjs.Interaction, uptime: string) {
    const content = {
        embeds: [discordEmbeds.getUptimeEmbed(uptime)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendVoiceMessage(interaction: discordjs.Interaction, state: string) {
    const content = {
        embeds: [discordEmbeds.getVoiceEmbed(state)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendCraftMessage(interaction: discordjs.Interaction, craftDetails: any, quantity: number) {
    const content = {
        embeds: [discordEmbeds.getCraftEmbed(interaction.guildId as string, craftDetails, quantity)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendResearchMessage(interaction: discordjs.Interaction, researchDetails: any) {
    const content = {
        embeds: [discordEmbeds.getResearchEmbed(interaction.guildId as string, researchDetails)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendRecycleMessage(interaction: discordjs.Interaction, recycleDetails: any, quantity: number,
    recyclerType: string) {
    const content = {
        embeds: [discordEmbeds.getRecycleEmbed(interaction.guildId as string, recycleDetails, quantity, recyclerType)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}

export async function sendBattlemetricsEventMessage(guildId: string, battlemetricsId: string, title: string,
    description: string, fields: discordjs.EmbedField[] | null = null, everyone: boolean = false) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const content = {
        embeds: [discordEmbeds.getBattlemetricsEventEmbed(guildId, battlemetricsId, title, description, fields)],
        content: everyone ? '@everyone' : ''
    }

    await discordTools.sendUpdateMessage(guildId, content, instance.channelIds.activity);
}

export async function sendItemMessage(interaction: discordjs.Interaction, itemName: string, itemId: string,
    type: string) {
    const content = {
        embeds: [discordEmbeds.getItemEmbed(interaction.guildId as string, itemName, itemId, type)],
        ephemeral: true
    }

    await discordTools.interactionEditReply(interaction, content);
}