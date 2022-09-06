const Discord = require('discord.js');

const Constants = require('../util/constants.js');
const Client = require('../../index.ts');

const SUCCESS = Discord.ButtonStyle.Success;
const DANGER = Discord.ButtonStyle.Danger;
const PRIMARY = Discord.ButtonStyle.Primary;
const SECONDARY = Discord.ButtonStyle.Secondary;
const LINK = Discord.ButtonStyle.Link;

module.exports = {
    getButton: function (options = {}) {
        const button = new Discord.ButtonBuilder();

        if (options.customId) button.setCustomId(options.customId);
        if (options.label) button.setLabel(options.label);
        if (options.style) button.setStyle(options.style);
        if (options.url) button.setURL(options.url);
        if (options.emoji) button.setEmoji(options.emoji);
        if (options.disabled) button.setDisabled(options.disabled);

        return button;
    },

    getServerButtons: function (guildId, serverId, state = null) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[serverId];
        const identifier = `{"serverId":"${serverId}"}`;

        if (state === null) state = (instance.serverList[serverId].active) ? 1 : 0;

        let connectionButton = null;
        if (state === 0) {
            connectionButton = module.exports.getButton({
                customId: `ServerConnect${identifier}`,
                label: 'CONNECT',
                style: PRIMARY
            });
        }
        else if (state === 1) {
            connectionButton = module.exports.getButton({
                customId: `ServerDisconnect${identifier}`,
                label: 'DISCONNECT',
                style: DANGER
            });
        }
        else if (state === 2) {
            connectionButton = module.exports.getButton({
                customId: `ServerReconnecting${identifier}`,
                label: 'RECONNECTING...',
                style: DANGER
            });
        }

        const customTimersButton = module.exports.getButton({
            customId: `CustomTimersEdit${identifier}`,
            label: 'CUSTOM TIMERS',
            style: PRIMARY
        });
        const trackerButton = module.exports.getButton({
            customId: `CreateTracker${identifier}`,
            label: 'CREATE TRACKER',
            style: PRIMARY
        });
        const groupButton = module.exports.getButton({
            customId: `CreateGroup${identifier}`,
            label: 'CREATE GROUP',
            style: PRIMARY
        });
        let linkButton = module.exports.getButton({
            label: 'WEBSITE',
            style: LINK,
            url: server.url
        });
        let deleteButton = module.exports.getButton({
            customId: `ServerDelete${identifier}`,
            style: SECONDARY,
            emoji: '🗑️'
        });

        if (server.battlemetricsId !== null) {
            return [
                new Discord.ActionRowBuilder().addComponents(
                    connectionButton, linkButton, deleteButton
                ),
                new Discord.ActionRowBuilder().addComponents(
                    customTimersButton, trackerButton, groupButton
                )
            ];
        }
        else {
            return [
                new Discord.ActionRowBuilder().addComponents(
                    connectionButton, linkButton, deleteButton
                ),
                new Discord.ActionRowBuilder().addComponents(
                    customTimersButton, groupButton
                )
            ];
        }
    },

    getSmartSwitchButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartSwitch${entity.active ? 'Off' : 'On'}${identifier}`,
                label: entity.active ? 'TURN OFF' : 'TURN ON',
                style: entity.active ? DANGER : SUCCESS
            }),
            module.exports.getButton({
                customId: `SmartSwitchEdit${identifier}`,
                label: 'EDIT',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartSwitchDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartSwitchGroupButtons: function (serverId, groupId) {
        const identifier = `{"serverId":"${serverId}","groupId":${groupId}}`;

        return [
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `GroupTurnOn${identifier}`,
                    label: 'TURN ON',
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `GroupTurnOff${identifier}`,
                    label: 'TURN OFF',
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `GroupEdit${identifier}`,
                    label: 'EDIT',
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `GroupDelete${identifier}`,
                    style: SECONDARY,
                    emoji: '🗑️'
                })),
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `GroupAddSwitch${identifier}`,
                    label: 'ADD SWITCH',
                    style: SUCCESS
                }),
                module.exports.getButton({
                    customId: `GroupRemoveSwitch${identifier}`,
                    label: 'REMOVE SWITCH',
                    style: DANGER
                }))
        ];
    },

    getSmartAlarmButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartAlarmEveryone${identifier}`,
                label: '@everyone',
                style: entity.everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `SmartAlarmEdit${identifier}`,
                label: 'EDIT',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartAlarmDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorToolCupboardButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardEveryone${identifier}`,
                label: '@everyone',
                style: entity.everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardInGame${identifier}`,
                label: 'IN-GAME',
                style: entity.inGame ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorEdit${identifier}`,
                label: 'EDIT',
                style: PRIMARY,
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorContainerButton: function (serverId, entityId) {
        const identifier = `{"serverId":"${serverId}","entityId":${entityId}}`;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorEdit${identifier}`,
                label: 'EDIT',
                style: PRIMARY,
            }),
            module.exports.getButton({
                customId: `StorageMonitorRecycle${identifier}`,
                label: 'RECYCLE',
                style: PRIMARY,
            }),
            module.exports.getButton({
                customId: `StorageMonitorContainerDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getRecycleDeleteButton: function () {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'RecycleDelete',
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getNotificationButtons: function (setting, discordActive, inGameActive) {
        const identifier = `{"setting":"${setting}"}`;

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `DiscordNotification${identifier}`,
                label: 'DISCORD',
                style: discordActive ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `InGameNotification${identifier}`,
                label: 'IN-GAME',
                style: inGameActive ? SUCCESS : DANGER
            }));
    },

    getInGameCommandsEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'AllowInGameCommands',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getInGameTeammateNotificationsButtons: function (guildId) {
        const instance = Client.client.readInstanceFile(guildId);

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'InGameTeammateConnection',
                label: 'CONNECTIONS',
                style: instance.generalSettings.connectionNotify ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'InGameTeammateAfk',
                label: 'AFK',
                style: instance.generalSettings.afkNotify ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'InGameTeammateDeath',
                label: 'DEATH',
                style: instance.generalSettings.deathNotify ? SUCCESS : DANGER
            }));
    },

    getFcmAlarmNotificationButtons: function (enabled, everyone) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'FcmAlarmNotification',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'FcmAlarmNotificationEveryone',
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }));
    },

    getSmartAlarmNotifyInGameButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'SmartAlarmNotifyInGame',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getLeaderCommandEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'LeaderCommandEnabled',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getTrackerButtons: function (guildId, trackerId) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerId];
        const identifier = `{"trackerId":${trackerId}}`;

        return [
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `TrackerActive${identifier}`,
                    label: tracker.active ? 'ACTIVE' : 'INACTIVE',
                    style: tracker.active ? SUCCESS : DANGER
                }),
                module.exports.getButton({
                    customId: `TrackerEveryone${identifier}`,
                    label: '@everyone',
                    style: tracker.everyone ? SUCCESS : DANGER
                }),
                module.exports.getButton({
                    customId: `TrackerEdit${identifier}`,
                    label: 'EDIT',
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `TrackerDelete${identifier}`,
                    style: SECONDARY,
                    emoji: '🗑️'
                })),
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `TrackerAddPlayer${identifier}`,
                    label: 'ADD PLAYER',
                    style: SUCCESS
                }),
                module.exports.getButton({
                    customId: `TrackerRemovePlayer${identifier}`,
                    label: 'REMOVE PLAYER',
                    style: DANGER
                }))
        ];
    },

    getTrackerNotifyButtons: function (allOffline, anyOnline) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'TrackerNotifyAllOffline',
                label: 'ALL OFFLINE',
                style: allOffline ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'TrackerNotifyAnyOnline',
                label: 'ANY ONLINE',
                style: anyOnline ? SUCCESS : DANGER
            }));
    },

    getNewsButton: function (body, validURL) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                style: LINK,
                label: 'LINK',
                url: validURL ? body.url : Constants.DEFAULT_SERVER_URL
            }));
    },
}