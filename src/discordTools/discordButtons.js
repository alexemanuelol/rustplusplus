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
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        const identifier = JSON.stringify({ "serverId": serverId });

        if (state === null) state = (instance.serverList[serverId].active) ? 1 : 0;

        let connectionButton = null;
        if (state === 0) {
            connectionButton = module.exports.getButton({
                customId: `ServerConnect${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonConnect'),
                style: PRIMARY
            });
        }
        else if (state === 1) {
            connectionButton = module.exports.getButton({
                customId: `ServerDisconnect${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonDisconnect'),
                style: DANGER
            });
        }
        else if (state === 2) {
            connectionButton = module.exports.getButton({
                customId: `ServerReconnecting${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonReconnecting'),
                style: DANGER
            });
        }

        const customTimersButton = module.exports.getButton({
            customId: `CustomTimersEdit${identifier}`,
            label: Client.client.intlGet(guildId, 'buttonCustomTimers'),
            style: PRIMARY
        });
        const trackerButton = module.exports.getButton({
            customId: `CreateTracker${identifier}`,
            label: Client.client.intlGet(guildId, 'buttonCreateTracker'),
            style: PRIMARY
        });
        const groupButton = module.exports.getButton({
            customId: `CreateGroup${identifier}`,
            label: Client.client.intlGet(guildId, 'buttonCreateGroup'),
            style: PRIMARY
        });
        let linkButton = module.exports.getButton({
            label: Client.client.intlGet(guildId, 'buttonWebsite'),
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
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartSwitch${entity.active ? 'Off' : 'On'}${identifier}`,
                label: entity.active ?
                    Client.client.intlGet(guildId, 'buttonTurnOffSwitch') :
                    Client.client.intlGet(guildId, 'buttonTurnOnSwitch'),
                style: entity.active ? DANGER : SUCCESS
            }),
            module.exports.getButton({
                customId: `SmartSwitchEdit${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonEdit'),
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartSwitchDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartSwitchGroupButtons: function (guildId, serverId, groupId) {
        const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

        return [
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `GroupTurnOn${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonTurnOnSwitch'),
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `GroupTurnOff${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonTurnOffSwitch'),
                    style: PRIMARY
                }),
                module.exports.getButton({
                    customId: `GroupEdit${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonEdit'),
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
                    label: Client.client.intlGet(guildId, 'buttonGroupAddSwitch'),
                    style: SUCCESS
                }),
                module.exports.getButton({
                    customId: `GroupRemoveSwitch${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonGroupRemoveSwitch'),
                    style: DANGER
                }))
        ];
    },

    getSmartAlarmButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartAlarmEveryone${identifier}`,
                label: '@everyone',
                style: entity.everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `SmartAlarmEdit${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonEdit'),
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartAlarmDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorToolCupboardButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardEveryone${identifier}`,
                label: '@everyone',
                style: entity.everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardInGame${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonInGame'),
                style: entity.inGame ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorEdit${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonEdit'),
                style: PRIMARY,
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardDelete${identifier}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorContainerButton: function (guildId, serverId, entityId) {
        const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorEdit${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonEdit'),
                style: PRIMARY,
            }),
            module.exports.getButton({
                customId: `StorageMonitorRecycle${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonRecycle'),
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

    getNotificationButtons: function (guildId, setting, discordActive, inGameActive) {
        const identifier = JSON.stringify({ "setting": setting });

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `DiscordNotification${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonDiscord'),
                style: discordActive ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `InGameNotification${identifier}`,
                label: Client.client.intlGet(guildId, 'buttonInGame'),
                style: inGameActive ? SUCCESS : DANGER
            }));
    },

    getInGameCommandsEnabledButton: function (guildId, enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'AllowInGameCommands',
                label: enabled ?
                    Client.client.intlGet(guildId, 'buttonEnabled') :
                    Client.client.intlGet(guildId, 'buttonDisabled'),
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getInGameTeammateNotificationsButtons: function (guildId) {
        const instance = Client.client.getInstance(guildId);

        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'InGameTeammateConnection',
                label: Client.client.intlGet(guildId, 'buttonConnections'),
                style: instance.generalSettings.connectionNotify ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'InGameTeammateAfk',
                label: Client.client.intlGet(guildId, 'buttonAfk'),
                style: instance.generalSettings.afkNotify ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'InGameTeammateDeath',
                label: Client.client.intlGet(guildId, 'buttonDeath'),
                style: instance.generalSettings.deathNotify ? SUCCESS : DANGER
            }));
    },

    getFcmAlarmNotificationButtons: function (guildId, enabled, everyone) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'FcmAlarmNotification',
                label: enabled ?
                    Client.client.intlGet(guildId, 'buttonEnabled') :
                    Client.client.intlGet(guildId, 'buttonDisabled'),
                style: enabled ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'FcmAlarmNotificationEveryone',
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }));
    },

    getSmartAlarmNotifyInGameButton: function (guildId, enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'SmartAlarmNotifyInGame',
                label: enabled ?
                    Client.client.intlGet(guildId, 'buttonEnabled') :
                    Client.client.intlGet(guildId, 'buttonDisabled'),
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getLeaderCommandEnabledButton: function (guildId, enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'LeaderCommandEnabled',
                label: enabled ?
                    Client.client.intlGet(guildId, 'buttonEnabled') :
                    Client.client.intlGet(guildId, 'buttonDisabled'),
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getTrackerButtons: function (guildId, trackerId) {
        const instance = Client.client.getInstance(guildId);
        const tracker = instance.trackers[trackerId];
        const identifier = JSON.stringify({ "trackerId": trackerId });

        return [
            new Discord.ActionRowBuilder().addComponents(
                module.exports.getButton({
                    customId: `TrackerActive${identifier}`,
                    label: tracker.active ?
                        Client.client.intlGet(guildId, 'buttonActive') :
                        Client.client.intlGet(guildId, 'buttonInactive'),
                    style: tracker.active ? SUCCESS : DANGER
                }),
                module.exports.getButton({
                    customId: `TrackerEveryone${identifier}`,
                    label: '@everyone',
                    style: tracker.everyone ? SUCCESS : DANGER
                }),
                module.exports.getButton({
                    customId: `TrackerEdit${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonEdit'),
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
                    label: Client.client.intlGet(guildId, 'buttonAddPlayer'),
                    style: SUCCESS
                }),
                module.exports.getButton({
                    customId: `TrackerRemovePlayer${identifier}`,
                    label: Client.client.intlGet(guildId, 'buttonRemovePlayer'),
                    style: DANGER
                }))
        ];
    },

    getTrackerNotifyButtons: function (guildId, allOffline, anyOnline) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'TrackerNotifyAllOffline',
                label: Client.client.intlGet(guildId, 'buttonAllOffline'),
                style: allOffline ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: 'TrackerNotifyAnyOnline',
                label: Client.client.intlGet(guildId, 'buttonAnyOnline'),
                style: anyOnline ? SUCCESS : DANGER
            }));
    },

    getNewsButton: function (guildId, body, validURL) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                style: LINK,
                label: Client.client.intlGet(guildId, 'buttonLink'),
                url: validURL ? body.url : Constants.DEFAULT_SERVER_URL
            }));
    },

    getBotMutedInGameButton: function (guildId, isMuted) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'BotMutedInGame',
                label: isMuted ?
                    Client.client.intlGet(guildId, 'buttonMuted') :
                    Client.client.intlGet(guildId, 'buttonUnmuted'),
                style: isMuted ? DANGER : SUCCESS
            }));
    },

    getMapWipeNotifyEveryoneButton: function (everyone) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: 'MapWipeNotifyEveryone',
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }));
    },
}