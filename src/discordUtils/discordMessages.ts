/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import { log, guildInstanceManager as gim, credentialsManager as cm } from '../../index';
import * as discordButtons from './discordButtons';
import * as discordEmbeds from './discordEmbeds';
import * as discordSelectMenus from './discordSelectMenus';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { NewsNewsBody, PlayerDeathBody, TeamLoginBody } from '../managers/fcmListenerManager';


/**
 * Direct-Message based messages
 */

export async function sendCredentialsExpiredMessage(dm: DiscordManager, steamId: types.SteamId) {
    const funcName = `[sendCredentialsExpiredMessage: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const user = await dm.getUser(credentials.discordUserId);

    if (!user) {
        log.warn(`${funcName} Could not find user '${credentials.discordUserId}'.`);
        return;
    }

    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');
    const content = {
        embeds: [await discordEmbeds.getCredentialsExpiredEmbed(dm, steamId, 'rustplusplus_logo.png')],
        components: discordButtons.getCredentialsExpiredButtons(),
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleMessage(user, content, 'send');
}

export async function sendFcmPlayerDeathMessage(dm: DiscordManager, steamId: types.SteamId, title: string,
    body: PlayerDeathBody) {
    const funcName = `[sendFcmPlayerDeathMessage: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);

    if (!credentials) {
        log.warn(`${funcName} Could not find credentials.`);
        return;
    }

    const user = await dm.getUser(credentials.discordUserId);

    if (!user) {
        log.warn(`${funcName} Could not find user '${credentials.discordUserId}'.`);
        return;
    }

    const content = {
        embeds: [await discordEmbeds.getFcmPlayerDeathEmbed(title, body)]
    };

    await dm.handleMessage(user, content, 'send');
}


/**
 * Slash Command based messages
 */

export async function sendDefaultMessage(dm: DiscordManager, interaction: discordjs.Interaction, title: string,
    description: string, parameters: { [key: string]: string } = {}) {
    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');

    const content = {
        embeds: [discordEmbeds.getDefaultEmbed(dm, interaction, 'rustplusplus_logo.png', title, description, parameters)],
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleInteractionReply(interaction, content, 'editReply');
}

export async function sendHelpMessage(dm: DiscordManager, interaction: discordjs.Interaction) {
    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');

    const content = {
        embeds: [discordEmbeds.getHelpEmbed(dm, 'rustplusplus_logo.png')],
        components: discordButtons.getHelpButtons(),
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleInteractionReply(interaction, content, 'editReply');
}

export async function sendRoleListMessage(dm: DiscordManager, interaction: discordjs.Interaction) {
    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');

    const content = {
        embeds: [discordEmbeds.getRoleListEmbed(dm, interaction, 'rustplusplus_logo.png')],
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleInteractionReply(interaction, content, 'editReply');
}

export async function sendCredentialsInfoMessage(dm: DiscordManager, interaction: discordjs.Interaction) {
    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');

    const content = {
        embeds: [await discordEmbeds.getCredentialsInfoEmbed(dm, interaction, 'rustplusplus_logo.png')],
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleInteractionReply(interaction, content, 'editReply');
}

export async function sendCredentialsListMessage(dm: DiscordManager, interaction: discordjs.Interaction) {
    const imagePath = path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png');

    const content = {
        embeds: [discordEmbeds.getCredentialsListEmbed(dm, interaction, 'rustplusplus_logo.png')],
        files: [new discordjs.AttachmentBuilder(imagePath)]
    };

    await dm.handleInteractionReply(interaction, content, 'editReply');
}


/**
 * Guild based messages
 */

export async function sendServerMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendServerMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    // TODO! Figure out what connection should be, based on rustplusManager and GuildInstance activeServerId
    const connection = discordButtons.ButtonConnectionTypes.Disconnected;

    const content = {
        embeds: [discordEmbeds.getServerEmbed(guildId, serverId)],
        components: discordButtons.getServerButtons(guildId, serverId, connection)
    };

    const message = await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.servers, serverInfo.
        messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        gInstance.serverInfoMap[serverId].messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

// TODO! For smart devices, if the device is not responsive, change embed image to a cross or something, change color to RED, otherwise default color
export async function sendSmartSwitchMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendSmartSwitchMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const smartSwitch = serverInfo.smartSwitchMap[entityId];
    if (!smartSwitch) {
        log.warn(`${funcName} Could not find SmartSwitch '${entityId}'.`, logParam);
        return;
    }

    // TODO! Check if switch is active via rustplusManager
    const active = false;

    const content = {
        embeds: [discordEmbeds.getSmartSwitchEmbed(guildId, serverId, entityId, active)],
        components: [
            discordSelectMenus.getSmartSwitchSelectMenu(guildId, serverId, entityId),
            discordButtons.getSmartSwitchButtons(guildId, serverId, entityId, active)
        ],
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'electrics',
                smartSwitch.img))
        ]
    };

    const message = await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.smartSwitches,
        smartSwitch.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        smartSwitch.messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

export async function sendSmartAlarmMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendSmartAlarmMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const smartAlarm = serverInfo.smartAlarmMap[entityId];
    if (!smartAlarm) {
        log.warn(`${funcName} Could not find SmartAlarm '${entityId}'.`, logParam);
        return;
    }

    // TODO! Check if alarm is active via rustplusManager
    const active = false;

    const content = {
        embeds: [discordEmbeds.getSmartAlarmEmbed(guildId, serverId, entityId, active)],
        components: [
            discordButtons.getSmartAlarmButtons(guildId, serverId, entityId)
        ],
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'electrics',
                smartAlarm.img))
        ]
    };

    const message = await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.smartAlarms,
        smartAlarm.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        smartAlarm.messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

export async function sendStorageMonitorMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendStorageMonitorMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const storageMonitor = serverInfo.storageMonitorMap[entityId];
    if (!storageMonitor) {
        log.warn(`${funcName} Could not find StorageMonitor '${entityId}'.`, logParam);
        return;
    }

    const content = {
        embeds: [discordEmbeds.getStorageMonitorEmbed(guildId, serverId, entityId)],
        components: [
            discordButtons.getStorageMonitorButtons(guildId, serverId, entityId)
        ],
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'electrics',
                storageMonitor.img))
        ]
    };

    const message = await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.storageMonitors,
        storageMonitor.messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message) {
        storageMonitor.messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}


/**
 * Notifications based messages
 */

export async function sendFcmAlarmTriggerMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    title: string, message: string) {
    const funcName = `[sendFcmAlarmTriggerMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const content = {
        embeds: [discordEmbeds.getFcmAlarmTriggerEmbed(guildId, serverId, title, message)],
        content: gInstance.generalSettings.fcmAlarmNotifyEveryone ? '@everyone' : ''
    }

    await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.activity);
}

export async function sendFcmAlarmPluginTriggerMessage(dm: DiscordManager, guildId: types.GuildId,
    serverId: types.ServerId, title: string, message: string) {
    const funcName = `[sendFcmAlarmPluginTriggerMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const content = {
        embeds: [discordEmbeds.getFcmAlarmPluginTriggerEmbed(guildId, serverId, title, message)],
        content: gInstance.generalSettings.fcmAlarmPluginNotifyEveryone ? '@everyone' : '',
    }

    await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.activity);
}

export async function sendFcmTeamLoginMessage(dm: DiscordManager, guildId: types.GuildId,
    serverId: types.ServerId, body: TeamLoginBody) {
    const funcName = `[sendFcmTeamLoginMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const content = {
        embeds: [await discordEmbeds.getFcmTeamLoginEmbed(guildId, body)]
    }

    await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.activity);
}

export async function sendFcmNewsNewsMessage(dm: DiscordManager, guildId: types.GuildId, title: string,
    message: string, body: NewsNewsBody) {
    const funcName = `[sendFcmAlarmTriggerMessage]`;
    const logParam = { guildId: guildId };
    const gInstance = gim.getGuildInstance(guildId);

    if (!gInstance) {
        log.warn(`${funcName} Could not find GuildInstance.`, logParam);
        return;
    }

    const content = {
        embeds: [discordEmbeds.getFcmNewsNewsEmbed(guildId, title, message)],
        components: [discordButtons.getFcmNewsNewsButton(guildId, body)]
    }

    await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.activity);
}