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

import * as guildInstance from '../util/guild-instance';
import { client, localeManager as lm } from '../../index';
import * as constants from '../util/constants';

export function getButton(options: discordjs.ButtonComponentData): discordjs.ButtonBuilder {
    const button = new discordjs.ButtonBuilder();

    if (options.hasOwnProperty('customId') &&
        (options as discordjs.InteractionButtonComponentData).customId !== undefined) {
        button.setCustomId((options as discordjs.InteractionButtonComponentData).customId);
    }

    if (options.hasOwnProperty('label') && options.label !== undefined) {
        button.setLabel(options.label);
    }

    if (options.hasOwnProperty('style') && options.style !== undefined) {
        button.setStyle(options.style);
    }

    if (options.hasOwnProperty('url') && (options as discordjs.LinkButtonComponentData).url !== undefined &&
        (options as discordjs.LinkButtonComponentData).url !== '') {
        button.setURL((options as discordjs.LinkButtonComponentData).url);
    }

    if (options.hasOwnProperty('emoji') && options.emoji !== undefined) {
        button.setEmoji(options.emoji);
    }

    if (options.hasOwnProperty('disabled') && options.disabled !== undefined) {
        button.setDisabled(options.disabled);
    }

    return button;
}

export function getServerButtons(guildId: string, serverId: string, state: number | null = null):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
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
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });

    if (state === 1) {
        connectionButton = getButton({
            customId: `ServerDisconnect${identifier}`,
            label: lm.getIntl(language, 'disconnectCap'),
            style: discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        });
    }
    else if (state === 2) {
        connectionButton = getButton({
            customId: `ServerReconnecting${identifier}`,
            label: lm.getIntl(language, 'reconnectingCap'),
            style: discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        });
    }

    const deleteUnreachableDevicesButton = getButton({
        customId: `DeleteUnreachableDevices${identifier}`,
        label: lm.getIntl(language, 'deleteUnreachableDevicesCap'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });
    const customTimersButton = getButton({
        customId: `CustomTimersEdit${identifier}`,
        label: lm.getIntl(language, 'customTimersCap'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });
    const trackerButton = getButton({
        customId: `CreateTracker${identifier}`,
        label: lm.getIntl(language, 'createTrackerCap'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });
    const groupButton = getButton({
        customId: `CreateGroup${identifier}`,
        label: lm.getIntl(language, 'createGroupCap'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });
    const linkButton = getButton({
        label: lm.getIntl(language, 'websiteCap'),
        style: discordjs.ButtonStyle.Link,
        url: server.url,
        type: discordjs.ComponentType.Button
    });
    const battlemetricsButton = getButton({
        label: lm.getIntl(language, 'battlemetricsCap'),
        style: discordjs.ButtonStyle.Link,
        url: `${constants.BATTLEMETRICS_SERVER_URL}${server.battlemetricsId}`,
        type: discordjs.ComponentType.Button
    });
    const editButton = getButton({
        customId: `ServerEdit${identifier}`,
        label: lm.getIntl(language, 'editCap'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });
    const deleteButton = getButton({
        customId: `ServerDelete${identifier}`,
        style: discordjs.ButtonStyle.Secondary,
        emoji: '🗑️',
        type: discordjs.ComponentType.Button
    });

    if (server.battlemetricsId !== null) {
        return [
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                connectionButton, linkButton, battlemetricsButton, editButton, deleteButton
            ),
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                customTimersButton, trackerButton, groupButton
            ),
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                deleteUnreachableDevicesButton
            )
        ];
    }
    else {
        return [
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                connectionButton, linkButton, editButton, deleteButton
            ),
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                customTimersButton, groupButton
            ),
            new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
                deleteUnreachableDevicesButton
            )
        ];
    }
}

export function getSmartSwitchButtons(guildId: string, serverId: string, entityId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].switches[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartSwitch${entity.active ? 'Off' : 'On'}${identifier}`,
            label: entity.active ? lm.getIntl(language, 'turnOffCap') : lm.getIntl(language, 'turnOnCap'),
            style: entity.active ? discordjs.ButtonStyle.Danger : discordjs.ButtonStyle.Success,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartSwitchEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartSwitchDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getSmartSwitchGroupButtons(guildId: string, serverId: string, groupId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: `GroupTurnOn${identifier}`,
                label: lm.getIntl(language, 'turnOnCap'),
                style: discordjs.ButtonStyle.Primary,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `GroupTurnOff${identifier}`,
                label: lm.getIntl(language, 'turnOffCap'),
                style: discordjs.ButtonStyle.Primary,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `GroupEdit${identifier}`,
                label: lm.getIntl(language, 'editCap'),
                style: discordjs.ButtonStyle.Primary,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `GroupDelete${identifier}`,
                style: discordjs.ButtonStyle.Secondary,
                emoji: '🗑️',
                type: discordjs.ComponentType.Button
            })),
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: `GroupAddSwitch${identifier}`,
                label: lm.getIntl(language, 'addSwitchCap'),
                style: discordjs.ButtonStyle.Success,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `GroupRemoveSwitch${identifier}`,
                label: lm.getIntl(language, 'removeSwitchCap'),
                style: discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }))
    ];
}

export function getSmartAlarmButtons(guildId: string, serverId: string, entityId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].alarms[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartAlarmEveryone${identifier}`,
            label: '@everyone',
            style: entity.everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartAlarmEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartAlarmDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getStorageMonitorToolCupboardButtons(guildId: string, serverId: string, entityId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `StorageMonitorToolCupboardEveryone${identifier}`,
            label: '@everyone',
            style: entity.everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `StorageMonitorToolCupboardInGame${identifier}`,
            label: lm.getIntl(language, 'inGameCap'),
            style: entity.inGame ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `StorageMonitorEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `StorageMonitorToolCupboardDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getStorageMonitorContainerButton(guildId: string, serverId: string, entityId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `StorageMonitorEdit${identifier}`,
            label: lm.getIntl(language, 'editCap'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `StorageMonitorRecycle${identifier}`,
            label: lm.getIntl(language, 'recycleCap'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `StorageMonitorContainerDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));

}

export function getRecycleDeleteButton(): discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'RecycleDelete',
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getNotificationButtons(guildId: string, setting: string, discordActive: boolean, inGameActive: boolean,
    voiceActive: boolean): discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const identifier = JSON.stringify({ "setting": setting });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `DiscordNotification${identifier}`,
            label: lm.getIntl(language, 'discordCap'),
            style: discordActive ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `InGameNotification${identifier}`,
            label: lm.getIntl(language, 'inGameCap'),
            style: inGameActive ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `VoiceNotification${identifier}`,
            label: lm.getIntl(language, 'voiceCap'),
            style: voiceActive ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getInGameCommandsEnabledButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'AllowInGameCommands',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getInGameTeammateNotificationsButtons(guildId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'InGameTeammateConnection',
            label: lm.getIntl(language, 'connectionsCap'),
            style: instance.generalSettings.connectionNotify ? discordjs.ButtonStyle.Success :
                discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: 'InGameTeammateAfk',
            label: lm.getIntl(language, 'afkCap'),
            style: instance.generalSettings.afkNotify ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: 'InGameTeammateDeath',
            label: lm.getIntl(language, 'deathCap'),
            style: instance.generalSettings.deathNotify ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getFcmAlarmNotificationButtons(guildId: string, enabled: boolean, everyone: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'FcmAlarmNotification',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: 'FcmAlarmNotificationEveryone',
            label: '@everyone',
            style: everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getSmartAlarmNotifyInGameButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'SmartAlarmNotifyInGame',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'SmartSwitchNotifyInGameWhenChangedFromDiscord',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getLeaderCommandEnabledButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'LeaderCommandEnabled',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getLeaderCommandOnlyForPairedButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'LeaderCommandOnlyForPaired',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getTrackerButtons(guildId: string, trackerId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const identifier = JSON.stringify({ "trackerId": trackerId });

    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: `TrackerAddPlayer${identifier}`,
                label: lm.getIntl(language, 'addPlayerCap'),
                style: discordjs.ButtonStyle.Success,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `TrackerRemovePlayer${identifier}`,
                label: lm.getIntl(language, 'removePlayerCap'),
                style: discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `TrackerEdit${identifier}`,
                label: lm.getIntl(language, 'editCap'),
                style: discordjs.ButtonStyle.Primary,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `TrackerDelete${identifier}`,
                style: discordjs.ButtonStyle.Secondary,
                emoji: '🗑️',
                type: discordjs.ComponentType.Button
            })),
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: `TrackerInGame${identifier}`,
                label: lm.getIntl(language, 'inGameCap'),
                style: tracker.inGame ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `TrackerEveryone${identifier}`,
                label: '@everyone',
                style: tracker.everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: `TrackerUpdate${identifier}`,
                label: lm.getIntl(language, 'updateCap'),
                style: discordjs.ButtonStyle.Primary,
                type: discordjs.ComponentType.Button
            }))
    ];
}

export function getNewsButton(guildId: string, url: string, validUrl: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            style: discordjs.ButtonStyle.Link,
            label: lm.getIntl(language, 'linkCap'),
            url: validUrl ? url : constants.DEFAULT_SERVER_URL,
            type: discordjs.ComponentType.Button
        }));
}

export function getBotMutedInGameButton(guildId: string, isMuted: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'BotMutedInGame',
            label: isMuted ? lm.getIntl(language, 'mutedCap') : lm.getIntl(language, 'unmutedCap'),
            style: isMuted ? discordjs.ButtonStyle.Danger : discordjs.ButtonStyle.Success,
            type: discordjs.ComponentType.Button
        }));
}

export function getMapWipeNotifyEveryoneButton(everyone: boolean): discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'MapWipeNotifyEveryone',
            label: '@everyone',
            style: everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getItemAvailableNotifyInGameButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'ItemAvailableNotifyInGame',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getHelpButtons(): discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'DEVELOPER',
                url: 'https://github.com/alexemanuelol',
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'REPOSITORY',
                url: 'https://github.com/alexemanuelol/rustplusplus',
                type: discordjs.ComponentType.Button
            })
        ),
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'DOCUMENTATION',
                url: 'https://github.com/alexemanuelol/rustplusplus/blob/master/docs/documentation.md',
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'CREDENTIALS',
                url: 'https://github.com/alexemanuelol/rustplusplus-Credential-Application/releases/v1.1.0',
                type: discordjs.ComponentType.Button
            })
        )];
}

export function getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId: string, enabled: boolean):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: 'DisplayInformationBattlemetricsAllOnlinePlayers',
            label: enabled ? lm.getIntl(language, 'enabledCap') : lm.getIntl(language, 'disabledCap'),
            style: enabled ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }));
}

export function getSubscribeToChangesBattlemetricsButtons(guildId: string):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: 'BattlemetricsServerNameChanges',
                label: lm.getIntl(language, 'battlemetricsServerNameChangesCap'),
                style: instance.generalSettings.battlemetricsServerNameChanges ? discordjs.ButtonStyle.Success :
                    discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: 'BattlemetricsTrackerNameChanges',
                label: lm.getIntl(language, 'battlemetricsTrackerNameChangesCap'),
                style: instance.generalSettings.battlemetricsTrackerNameChanges ? discordjs.ButtonStyle.Success :
                    discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: 'BattlemetricsGlobalNameChanges',
                label: lm.getIntl(language, 'battlemetricsGlobalNameChangesCap'),
                style: instance.generalSettings.battlemetricsGlobalNameChanges ? discordjs.ButtonStyle.Success :
                    discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            })),
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                customId: 'BattlemetricsGlobalLogin',
                label: lm.getIntl(language, 'battlemetricsGlobalLoginCap'),
                style: instance.generalSettings.battlemetricsGlobalLogin ? discordjs.ButtonStyle.Success :
                    discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                customId: 'BattlemetricsGlobalLogout',
                label: lm.getIntl(language, 'battlemetricsGlobalLogoutCap'),
                style: instance.generalSettings.battlemetricsGlobalLogout ? discordjs.ButtonStyle.Success :
                    discordjs.ButtonStyle.Danger,
                type: discordjs.ComponentType.Button
            }))];
}