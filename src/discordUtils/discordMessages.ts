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

import { log, guildInstanceManager as gim, credentialsManager as cm, localeManager as lm } from '../../index';
import { ConnectionStatus } from '../managers/rustPlusManager';
import * as constants from '../utils/constants';
import * as discordButtons from './discordButtons';
import * as discordEmbeds from './discordEmbeds';
import * as discordSelectMenus from './discordSelectMenus';
import { DiscordManager } from '../managers/discordManager';
import * as types from '../utils/types';
import { NewsNewsBody, PlayerDeathBody, TeamLoginBody } from '../managers/fcmListenerManager';
import { EventNotificationSettings, GuildInstance, SettingsMessages } from '../managers/guildInstanceManager';
import { Credentials } from '../managers/credentialsManager';


/**
 * Direct-Message based messages
 */

export async function sendCredentialsExpiredMessage(dm: DiscordManager, steamId: types.SteamId) {
    const funcName = `[sendCredentialsExpiredMessage: ${steamId}]`;
    const credentials = cm.getCredentials(steamId) as Credentials;

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
    const credentials = cm.getCredentials(steamId) as Credentials;

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
        embeds: [discordEmbeds.getDefaultEmbed(dm, interaction, 'rustplusplus_logo.png', title, description,
            parameters)],
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
    connectionStatus: ConnectionStatus, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendServerMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const serverInfo = gInstance.serverInfoMap[serverId];
    if (!serverInfo) {
        log.warn(`${funcName} Could not find ServerInfo.`, logParam);
        return;
    }

    const content = {
        embeds: [discordEmbeds.getServerEmbed(guildId, serverId)],
        components: [
            await discordSelectMenus.getMainRequesterSteamIdSelectMenu(dm, guildId, serverId),
            discordButtons.getServerButtons(guildId, serverId, connectionStatus)]
    };

    const message = await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.servers, serverInfo.
        messageId, interaction);

    if (interaction === null && message instanceof discordjs.Message &&
        gInstance.serverInfoMap[serverId].messageId !== message.id) {
        gInstance.serverInfoMap[serverId].messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

// TODO! For smart devices, if the device is not responsive, change embed image to a cross or something, change color 
// to RED, otherwise default color
export async function sendSmartSwitchMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendSmartSwitchMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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

    if (interaction === null && message instanceof discordjs.Message &&
        smartSwitch.messageId !== message.id) {
        smartSwitch.messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

export async function sendSmartAlarmMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendSmartAlarmMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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

    if (interaction === null && message instanceof discordjs.Message &&
        smartAlarm.messageId !== message.id) {
        smartAlarm.messageId = message.id;
        gim.updateGuildInstance(guildId);
    }
}

export async function sendStorageMonitorMessage(dm: DiscordManager, guildId: types.GuildId, serverId: types.ServerId,
    entityId: types.EntityId, interaction: discordjs.Interaction | null = null) {
    const funcName = `[sendStorageMonitorMessage]`;
    const logParam = { guildId: guildId, serverId: serverId };
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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

    if (interaction === null && message instanceof discordjs.Message &&
        storageMonitor.messageId !== message.id) {
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
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

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
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const content = {
        embeds: [discordEmbeds.getFcmNewsNewsEmbed(guildId, title, message)],
        components: [discordButtons.getFcmNewsNewsButton(guildId, body)]
    }

    await dm.sendUpdateMessage(guildId, content, gInstance.guildChannelIds.activity);
}


/**
 * Settings based messages
 */

async function updateSettingsMessage(dm: DiscordManager, guildId: types.GuildId,
    content: discordjs.MessageCreateOptions | discordjs.MessageEditOptions, setting: keyof SettingsMessages,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const channelId = gInstance.guildChannelIds.settings as types.ChannelId;
    const messageId = gInstance.settingsMessages[setting];
    let message = messageId ? await dm.getMessage(guildId, channelId, messageId) : undefined;

    if (interaction || create) {
        message = await dm.sendUpdateMessage(guildId, content, channelId, messageId, interaction);
    }
    else if (message && update) {
        message = await dm.handleMessage(message, content, 'edit');
    }

    if (interaction === null) {
        if (message instanceof discordjs.Message) {
            gInstance.settingsMessages[setting] = message.id;
        }
        else {
            gInstance.settingsMessages[setting] = null;
        }
    }
}

export async function sendSettingGeneralSettingsHeaderMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const content = {
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'settings',
                `general_settings_logo_${gInstance.generalSettings.language}.png`))
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'generalSettingsHeader', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingLanguageMessage(dm: DiscordManager, guildId: types.GuildId, update: boolean = true,
    create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingLanguageTitle')} :earth_africa:**`,
            description: `${lm.getIntl(language, 'settingLanguageDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordSelectMenus.getSettingLanguageSelectMenu(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'language', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingVoiceGenderMessage(dm: DiscordManager, guildId: types.GuildId, update: boolean = true,
    create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingVoiceGenderTitle')} :man:/:woman:**`,
            description: `${lm.getIntl(language, 'settingVoiceGenderDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordSelectMenus.getSettingVoiceGenderSelectMenu(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'voiceGender', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatFunctionalityEnabledMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatFunctionalityEnabledTitle')} :speech_left:**`,
            description: `${lm.getIntl(language, 'settingInGameChatFunctionalityEnabledDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatFunctionalityEnabledButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatFunctionalityEnabled', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatBotUnmutedMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatBotUnmutedTitle')} :shushing_face:**`,
            description: `${lm.getIntl(language, 'settingInGameChatBotUnmutedDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatBotUnmutedButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatBotUnmuted', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatTrademarkMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const trademark = gInstance.generalSettings.inGameChatTrademark;
    const description = lm.getIntl(language, 'settingInGameChatTrademarkDesc', {
        trademark: trademark === '' ? '' : `\`${trademark}\``
    });

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatTrademarkTitle')} :tm:**`,
            description: description,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatTrademarkButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatTrademark', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatCommandPrefixMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const commandPrefix = gInstance.generalSettings.inGameChatCommandPrefix;
    const description = lm.getIntl(language, 'settingInGameChatCommandPrefixDesc', {
        prefix: `\`${commandPrefix}\``
    });

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatCommandPrefixTitle')} :symbols:**`,
            description: description,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatCommandPrefixButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatCommandPrefix', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatCommandsEnabledMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatCommandsEnabledTitle')} :keyboard:**`,
            description: `${lm.getIntl(language, 'settingInGameChatCommandsEnabledDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatCommandsEnabledButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatCommandsEnabled', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatCommandResponseDelayMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatCommandResponseDelayTitle')} :timer:**`,
            description: `${lm.getIntl(language, 'settingInGameChatCommandResponseDelayDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordSelectMenus.getSettingInGameChatCommandResponseDelaySelectMenu(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatCommandResponseDelay', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingLeaderCommandMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingLeaderCommandTitle')} :crown:**`,
            description: `${lm.getIntl(language, 'settingLeaderCommandDesc', {
                buttonName: `\`${lm.getIntl(language, 'buttonOnlyPaired')}\``
            })}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingLeaderCommandButtons(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'leaderCommand', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatNotifySmartSwitchChangedFromDiscordMessage(dm: DiscordManager,
    guildId: types.GuildId, update: boolean = true, create: boolean = false,
    interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatNotifySmartSwitchChangedFromDiscordTitle')} ` +
                `:bell:**`,
            description: `${lm.getIntl(language, 'settingInGameChatNotifySmartSwitchChangedFromDiscordDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatNotifySmartSwitchChangedFromDiscordButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatNotifySmartSwitchChangedFromDiscord', update, create,
        interaction);
    /* gInstance is update at caller */
}

export async function sendSettingInGameChatNotifyMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingInGameChatNotifyTitle')} :bell:**`,
            description: `${lm.getIntl(language, 'settingInGameChatNotifyDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingInGameChatNotifyButtons(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'inGameChatNotify', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingMapWipeNotifyEveryoneMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingMapWipeNotifyEveryoneTitle')} :bell:**`,
            description: `${lm.getIntl(language, 'settingMapWipeNotifyEveryoneDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingMapWipeNotifyEveryoneButton(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'mapWipeNotifyEveryone', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingFcmAlarmNotifyMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingFcmAlarmNotifyTitle')} :bell:**`,
            description: `${lm.getIntl(language, 'settingFcmAlarmNotifyDesc')}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingFcmAlarmNotifyButtons(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'fcmAlarmNotify', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingFcmAlarmPluginNotifyMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, 'settingFcmAlarmPluginNotifyTitle')} :boom:**`,
            description: `${lm.getIntl(language, 'settingFcmAlarmPluginNotifyDesc', {
                link: `[${lm.getIntl(language, 'linkToThePlugin')}](https://umod.org/plugins/raid-alarm)`
            })}`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT)
        })],
        components: [
            discordButtons.getSettingFcmAlarmPluginNotifyButtons(guildId)
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'fcmAlarmPluginNotify', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingEventNotificationSettingsHeaderMessage(dm: DiscordManager, guildId: types.GuildId,
    update: boolean = true, create: boolean = false, interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const content = {
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'settings',
                `notification_settings_logo_${gInstance.generalSettings.language}.png`))
        ]
    };

    await updateSettingsMessage(dm, guildId, content, 'eventNotificationSettingsHeader', update, create, interaction);
    /* gInstance is update at caller */
}

export async function sendSettingEventNotificationSettingMessage(dm: DiscordManager, guildId: types.GuildId,
    setting: keyof EventNotificationSettings, update: boolean = true, create: boolean = false,
    interaction: discordjs.Interaction | null = null) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const content = {
        embeds: [discordEmbeds.getEmbed({
            title: `**${lm.getIntl(language, `eventNotificationSetting-${setting}`)}**`,
            color: discordEmbeds.colorHexToNumber(constants.COLOR_DEFAULT),
            thumbnail: { url: `attachment://${gInstance.eventNotificationSettings[setting].image}` },
        })],
        components: [
            discordButtons.getSettingEventNotificationSettingButtons(guildId, setting)
        ],
        files: [
            new discordjs.AttachmentBuilder(path.join(__dirname, '..', 'resources', 'images', 'events',
                gInstance.eventNotificationSettings[setting].image))
        ]
    };

    await updateSettingsMessage(dm, guildId, content, setting, update, create, interaction);
    /* gInstance is update at caller */
}