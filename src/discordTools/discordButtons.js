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

    getSmartSwitchButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartSwitch${instance.switches[id].active ? 'Off' : 'On'}Id${id}`,
                label: instance.switches[id].active ? 'TURN OFF' : 'TURN ON',
                style: instance.switches[id].active ? DANGER : SUCCESS
            }),
            module.exports.getButton({
                customId: `SmartSwitchEditId${id}`,
                label: 'EDIT',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartSwitchDeleteId${id}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getNotificationButtons: function (setting, discordActive, inGameActive) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `DiscordNotificationId${setting}`,
                label: 'DISCORD',
                style: discordActive ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `InGameNotificationId${setting}`,
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

    getInGameTeammateNotificationsButtons: function (instance) {
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

    getServerButtons: function (guildId, serverId, state = null) {
        const instance = Client.client.readInstanceFile(guildId);

        if (state === null) state = (instance.serverList[serverId].active) ? 1 : 0;

        let connectionButton = null;
        if (state === 0) {
            connectionButton = module.exports.getButton({
                customId: `ServerConnect{"serverId":"${serverId}"}`,
                label: 'CONNECT',
                style: PRIMARY
            });
        }
        else if (state === 1) {
            connectionButton = module.exports.getButton({
                customId: `ServerDisconnect{"serverId":"${serverId}"}`,
                label: 'DISCONNECT',
                style: DANGER
            });
        }
        else if (state === 2) {
            connectionButton = module.exports.getButton({
                customId: `ServerReconnecting{"serverId":"${serverId}"}`,
                label: 'RECONNECTING...',
                style: DANGER
            });
        }

        let trackerButton = module.exports.getButton({
            customId: `CreateTracker{"serverId":"${serverId}"}`,
            label: 'CREATE TRACKER',
            style: PRIMARY
        });
        let linkButton = module.exports.getButton({
            label: 'WEBSITE',
            style: LINK,
            url: instance.serverList[serverId].url
        });
        let deleteButton = module.exports.getButton({
            customId: `ServerDelete{"serverId":"${serverId}"}`,
            style: SECONDARY,
            emoji: '🗑️'
        });

        if (instance.serverList[serverId].battlemetricsId !== null) {
            return new Discord.ActionRowBuilder()
                .addComponents(connectionButton, trackerButton, linkButton, deleteButton);
        }
        else {
            return new Discord.ActionRowBuilder().addComponents(connectionButton, linkButton, deleteButton);
        }
    },

    getTrackerButtons: function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);
        const active = instance.trackers[trackerName].active;
        const everyone = instance.trackers[trackerName].everyone;
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `TrackerActiveId${trackerName}`,
                label: active ? 'ACTIVE' : 'INACTIVE',
                style: active ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `TrackerEveryoneId${trackerName}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `TrackerDeleteId${trackerName}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartAlarmButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const everyone = instance.serverList[serverId].alarms[entityId].everyone;
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `SmartAlarmEveryone{"serverId":"${serverId}","entityId":${entityId}}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `SmartAlarmEdit{"serverId":"${serverId}","entityId":${entityId}}`,
                label: 'EDIT',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `SmartAlarmDelete{"serverId":"${serverId}","entityId":${entityId}}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorToolCupboardButtons: function (guildId, serverId, entityId) {
        const instance = Client.client.readInstanceFile(guildId);
        const everyone = instance.serverList[serverId].storageMonitors[entityId].everyone;
        const inGame = instance.serverList[serverId].storageMonitors[entityId].inGame;
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardEveryone{"serverId":"${serverId}","entityId":${entityId}}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardInGame{"serverId":"${serverId}","entityId":${entityId}}`,
                label: 'IN-GAME',
                style: inGame ? SUCCESS : DANGER
            }),
            module.exports.getButton({
                customId: `StorageMonitorToolCupboardDelete{"serverId":"${serverId}","entityId":${entityId}}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorContainerButton: function (serverId, entityId) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `StorageMonitorContainerDelete{"serverId":"${serverId}","entityId":${entityId}}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartSwitchGroupButtons: function (name) {
        return new Discord.ActionRowBuilder().addComponents(
            module.exports.getButton({
                customId: `TurnOnGroupId${name}`,
                label: 'TURN ON',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `TurnOffGroupId${name}`,
                label: 'TURN OFF',
                style: PRIMARY
            }),
            module.exports.getButton({
                customId: `DeleteGroupId${name}`,
                style: SECONDARY,
                emoji: '🗑️'
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