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

import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

import * as guildInstance from '../util/guild-instance';
import { client, localeManager as lm } from '../../index';
import * as constants from '../util/constants';

export interface ButtonOptions {
    customId?: string;
    label?: string;
    style?: ButtonStyle;
    url?: string;
    emoji?: string;
    disabled?: boolean;
}

export function getButton(options: ButtonOptions): ButtonBuilder {
    const button = new ButtonBuilder();

    if (options.hasOwnProperty('customId') && options.customId !== undefined) {
        button.setCustomId(options.customId);
    }

    if (options.hasOwnProperty('label') && options.label !== undefined) {
        button.setLabel(options.label);
    }

    if (options.hasOwnProperty('style') && options.style !== undefined) {
        button.setStyle(options.style);
    }

    if (options.hasOwnProperty('url') && options.url !== undefined && options.url !== '') {
        button.setURL(options.url);
    }

    if (options.hasOwnProperty('emoji') && options.emoji !== undefined) {
        button.setEmoji(options.emoji);
    }

    if (options.hasOwnProperty('disabled') && options.disabled !== undefined) {
        button.setDisabled(options.disabled);
    }

    return button;
}

export function getServerButtons(guildId: string, serverId: string,
    state: number | null = null): ActionRowBuilder<ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const identifier = JSON.stringify({ "serverId": serverId });

    if (state === null) {
        if (instance.activeServer === serverId && client.activeRustplusInstances[guildId]) {
            state = 1;
        }
        else {
            state = 0;
        }
    }

    let connectionButton = getButton({
        customId: `ServerConnect${identifier}`,
        label: lm.getIntl(language, 'connectCap'),
        style: ButtonStyle.Primary
    });

    if (state === 1) {
        connectionButton = getButton({
            customId: `ServerDisconnect${identifier}`,
            label: lm.getIntl(language, 'disconnectCap'),
            style: ButtonStyle.Danger
        });
    }
    else if (state === 2) {
        connectionButton = getButton({
            customId: `ServerReconnecting${identifier}`,
            label: lm.getIntl(language, 'reconnectingCap'),
            style: ButtonStyle.Danger
        });
    }

    const deleteUnreachableDevicesButton = getButton({
        customId: `DeleteUnreachableDevices${identifier}`,
        label: lm.getIntl(language, 'deleteUnreachableDevicesCap'),
        style: ButtonStyle.Primary
    });
    const customTimersButton = getButton({
        customId: `CustomTimersEdit${identifier}`,
        label: lm.getIntl(language, 'customTimersCap'),
        style: ButtonStyle.Primary
    });
    const trackerButton = getButton({
        customId: `CreateTracker${identifier}`,
        label: lm.getIntl(language, 'createTrackerCap'),
        style: ButtonStyle.Primary
    });
    const groupButton = getButton({
        customId: `CreateGroup${identifier}`,
        label: lm.getIntl(language, 'createGroupCap'),
        style: ButtonStyle.Primary
    });
    const linkButton = getButton({
        label: lm.getIntl(language, 'websiteCap'),
        style: ButtonStyle.Link,
        url: server.url
    });
    const battlemetricsButton = getButton({
        label: lm.getIntl(language, 'battlemetricsCap'),
        style: ButtonStyle.Link,
        url: `${constants.BATTLEMETRICS_SERVER_URL}${server.battlemetricsId}`
    });
    const editButton = getButton({
        customId: `ServerEdit${identifier}`,
        label: lm.getIntl(language, 'editCap'),
        style: ButtonStyle.Primary
    });
    const deleteButton = getButton({
        customId: `ServerDelete${identifier}`,
        style: ButtonStyle.Secondary,
        emoji: '🗑️'
    });

    if (server.battlemetricsId !== null) {
        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                connectionButton, linkButton, battlemetricsButton, editButton, deleteButton
            ),
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                customTimersButton, trackerButton, groupButton
            ),
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                deleteUnreachableDevicesButton
            )
        ];
    }
    else {
        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                connectionButton, linkButton, editButton, deleteButton
            ),
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                customTimersButton, groupButton
            ),
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                deleteUnreachableDevicesButton
            )
        ];
    }
}

export function getSmartSwitchButtons(guildId: string, serverId: string, entityId: string):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].switches[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartSwitch${entity.active ? 'Off' : 'On'}${identifier}`,
            label: entity.active ? lm.getIntl(language, 'turnOffCap') : lm.getIntl(language, 'turnOnCap'),
            style: entity.active ? ButtonStyle.Danger : ButtonStyle.Success
        }),
        getButton({
            customId: `SmartSwitchEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: ButtonStyle.Primary
        }),
        getButton({
            customId: `SmartSwitchDelete${identifier}`,
            style: ButtonStyle.Secondary,
            emoji: '🗑️'
        }));
}

export function getSmartSwitchGroupButtons(guildId: string, serverId: string, groupId: string):
    ActionRowBuilder<ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

    return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: `GroupTurnOn${identifier}`,
                label: lm.getIntl(language, 'turnOnCap'),
                style: ButtonStyle.Primary
            }),
            getButton({
                customId: `GroupTurnOff${identifier}`,
                label: lm.getIntl(language, 'turnOffCap'),
                style: ButtonStyle.Primary
            }),
            getButton({
                customId: `GroupEdit${identifier}`,
                label: lm.getIntl(language, 'editCap'),
                style: ButtonStyle.Primary
            }),
            getButton({
                customId: `GroupDelete${identifier}`,
                style: ButtonStyle.Secondary,
                emoji: '🗑️'
            })),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: `GroupAddSwitch${identifier}`,
                label: lm.getIntl(language, 'addSwitchCap'),
                style: ButtonStyle.Success
            }),
            getButton({
                customId: `GroupRemoveSwitch${identifier}`,
                label: lm.getIntl(language, 'removeSwitchCap'),
                style: ButtonStyle.Danger
            }))
    ];
}

export function getSmartAlarmButtons(guildId: string, serverId: string, entityId: string):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].alarms[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartAlarmEveryone${identifier}`,
            label: '@everyone',
            style: entity.everyone ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: `SmartAlarmEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: ButtonStyle.Primary
        }),
        getButton({
            customId: `SmartAlarmDelete${identifier}`,
            style: ButtonStyle.Secondary,
            emoji: '🗑️'
        }));
}

export function getStorageMonitorToolCupboardButtons(guildId: string, serverId: string, entityId: string):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: `StorageMonitorToolCupboardEveryone${identifier}`,
            label: '@everyone',
            style: entity.everyone ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: `StorageMonitorToolCupboardInGame${identifier}`,
            label: lm.getIntl(language, 'inGameCap'),
            style: entity.inGame ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: `StorageMonitorEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: ButtonStyle.Primary,
        }),
        getButton({
            customId: `StorageMonitorToolCupboardDelete${identifier}`,
            style: ButtonStyle.Secondary,
            emoji: '🗑️'
        }));
}

export function getStorageMonitorContainerButton(guildId: string, serverId: string, entityId: string):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: `StorageMonitorEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: ButtonStyle.Primary,
        }),
        getButton({
            customId: `StorageMonitorRecycle${identifier}`,
            label: lm.getIntl(language, 'recycleCap'),
            style: ButtonStyle.Primary,
        }),
        getButton({
            customId: `StorageMonitorContainerDelete${identifier}`,
            style: ButtonStyle.Secondary,
            emoji: '🗑️'
        }));

}

export function getRecycleDeleteButton(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'RecycleDelete',
            style: ButtonStyle.Secondary,
            emoji: '🗑️'
        }));
}

export function getNotificationButtons(guildId: string, setting: string, discordActive: boolean,
    inGameActive: boolean, voiceActive: boolean): ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "setting": setting });

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: `DiscordNotification${identifier}`,
            label: lm.getIntl(language, 'discordCap'),
            style: discordActive ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: `InGameNotification${identifier}`,
            label: lm.getIntl(language, 'inGameCap'),
            style: inGameActive ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: `VoiceNotification${identifier}`,
            label: lm.getIntl(language, 'voiceCap'),
            style: voiceActive ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getInGameCommandsEnabledButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'AllowInGameCommands',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getInGameTeammateNotificationsButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'InGameTeammateConnection',
            label: lm.getIntl(language, 'connectionsCap'),
            style: instance.generalSettings.connectionNotify ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: 'InGameTeammateAfk',
            label: lm.getIntl(language, 'afkCap'),
            style: instance.generalSettings.afkNotify ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: 'InGameTeammateDeath',
            label: lm.getIntl(language, 'deathCap'),
            style: instance.generalSettings.deathNotify ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getFcmAlarmNotificationButtons(guildId: string, enabled: boolean, everyone: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'FcmAlarmNotification',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }),
        getButton({
            customId: 'FcmAlarmNotificationEveryone',
            label: '@everyone',
            style: everyone ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getSmartAlarmNotifyInGameButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'SmartAlarmNotifyInGame',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'SmartSwitchNotifyInGameWhenChangedFromDiscord',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getLeaderCommandEnabledButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'LeaderCommandEnabled',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getLeaderCommandOnlyForPairedButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'LeaderCommandOnlyForPaired',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getTrackerButtons(guildId: string, trackerId: string):
    ActionRowBuilder<ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const identifier = JSON.stringify({ "trackerId": trackerId });

    return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: `TrackerAddPlayer${identifier}`,
                label: lm.getIntl(language, 'addPlayerCap'),
                style: ButtonStyle.Success
            }),
            getButton({
                customId: `TrackerRemovePlayer${identifier}`,
                label: lm.getIntl(language, 'removePlayerCap'),
                style: ButtonStyle.Danger
            }),
            getButton({
                customId: `TrackerEdit${identifier}`,
                label: lm.getIntl(language, 'editCap'),
                style: ButtonStyle.Primary
            }),
            getButton({
                customId: `TrackerDelete${identifier}`,
                style: ButtonStyle.Secondary,
                emoji: '🗑️'
            })),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: `TrackerInGame${identifier}`,
                label: lm.getIntl(language, 'inGameCap'),
                style: tracker.inGame ? ButtonStyle.Success : ButtonStyle.Danger
            }),
            getButton({
                customId: `TrackerEveryone${identifier}`,
                label: '@everyone',
                style: tracker.everyone ? ButtonStyle.Success : ButtonStyle.Danger
            }),
            getButton({
                customId: `TrackerUpdate${identifier}`,
                label: lm.getIntl(language, 'updateCap'),
                style: ButtonStyle.Primary
            }))
    ];
}

export function getNewsButton(guildId: string, url: string, validUrl: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            style: ButtonStyle.Link,
            label: lm.getIntl(language, 'linkCap'),
            url: validUrl ? url : constants.DEFAULT_SERVER_URL
        }));
}

export function getBotMutedInGameButton(guildId: string, isMuted: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'BotMutedInGame',
            label: isMuted ? lm.getIntl(language, 'mutedCap') : lm.getIntl(language, 'unmutedCap'),
            style: isMuted ? ButtonStyle.Danger : ButtonStyle.Success
        }));
}

export function getMapWipeNotifyEveryoneButton(everyone: boolean): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'MapWipeNotifyEveryone',
            label: '@everyone',
            style: everyone ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getItemAvailableNotifyInGameButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'ItemAvailableNotifyInGame',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getHelpButtons(): ActionRowBuilder<ButtonBuilder>[] {
    return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                style: ButtonStyle.Link,
                label: 'DEVELOPER',
                url: 'https://github.com/alexemanuelol'
            }),
            getButton({
                style: ButtonStyle.Link,
                label: 'REPOSITORY',
                url: 'https://github.com/alexemanuelol/rustplusplus'
            })
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                style: ButtonStyle.Link,
                label: 'DOCUMENTATION',
                url: 'https://github.com/alexemanuelol/rustplusplus/blob/master/docs/documentation.md'
            }),
            getButton({
                style: ButtonStyle.Link,
                label: 'CREDENTIALS',
                url: 'https://github.com/alexemanuelol/rustplusplus-Credential-Application/releases/v1.1.0'
            })
        )];
}

export function getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId: string, enabled: boolean):
    ActionRowBuilder<ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        getButton({
            customId: 'DisplayInformationBattlemetricsAllOnlinePlayers',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? ButtonStyle.Success : ButtonStyle.Danger
        }));
}

export function getSubscribeToChangesBattlemetricsButtons(guildId: string): ActionRowBuilder<ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: 'BattlemetricsServerNameChanges',
                label: lm.getIntl(language, 'battlemetricsServerNameChangesCap'),
                style: instance.generalSettings.battlemetricsServerNameChanges ? ButtonStyle.Success :
                    ButtonStyle.Danger
            }),
            getButton({
                customId: 'BattlemetricsTrackerNameChanges',
                label: lm.getIntl(language, 'battlemetricsTrackerNameChangesCap'),
                style: instance.generalSettings.battlemetricsTrackerNameChanges ? ButtonStyle.Success :
                    ButtonStyle.Danger
            }),
            getButton({
                customId: 'BattlemetricsGlobalNameChanges',
                label: lm.getIntl(language, 'battlemetricsGlobalNameChangesCap'),
                style: instance.generalSettings.battlemetricsGlobalNameChanges ? ButtonStyle.Success :
                    ButtonStyle.Danger
            })),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            getButton({
                customId: 'BattlemetricsGlobalLogin',
                label: lm.getIntl(language, 'battlemetricsGlobalLoginCap'),
                style: instance.generalSettings.battlemetricsGlobalLogin ? ButtonStyle.Success :
                    ButtonStyle.Danger
            }),
            getButton({
                customId: 'BattlemetricsGlobalLogout',
                label: lm.getIntl(language, 'battlemetricsGlobalLogoutCap'),
                style: instance.generalSettings.battlemetricsGlobalLogout ? ButtonStyle.Success :
                    ButtonStyle.Danger
            }))];
}