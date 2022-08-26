const Discord = require('discord.js');

const Client = require('../../index.js');

const SUCCESS = Discord.ButtonStyle.Success;
const DANGER = Discord.ButtonStyle.Danger;
const PRIMARY = Discord.ButtonStyle.Primary;
const SECONDARY = Discord.ButtonStyle.Secondary;
const LINK = Discord.ButtonStyle.Link;

function getButton(options = {}) {
    const button = new Discord.ButtonBuilder();

    if (options.customId) button.setCustomId(options.customId);
    if (options.label) button.setLabel(options.label);
    if (options.style) button.setStyle(options.style);
    if (options.url) button.setURL(options.url);
    if (options.emoji) button.setEmoji(options.emoji);
    if (options.disabled) button.setDisabled(options.disabled);

    return button;
}

module.exports = {
    getSmartSwitchButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `SmartSwitch${instance.switches[id].active ? 'Off' : 'On'}Id${id}`,
                label: instance.switches[id].active ? 'TURN OFF' : 'TURN ON',
                style: instance.switches[id].active ? DANGER : SUCCESS
            }),
            getButton({
                customId: `SmartSwitchEditId${id}`,
                label: 'EDIT',
                style: PRIMARY
            }),
            getButton({
                customId: `SmartSwitchDeleteId${id}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getNotificationButtons: function (setting, discordActive, inGameActive) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `DiscordNotificationId${setting}`,
                label: 'DISCORD',
                style: discordActive ? SUCCESS : DANGER
            }),
            getButton({
                customId: `InGameNotificationId${setting}`,
                label: 'IN-GAME',
                style: inGameActive ? SUCCESS : DANGER
            }));
    },

    getInGameCommandsEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'AllowInGameCommands',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getInGameTeammateNotificationsButtons: function (instance) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'InGameTeammateConnection',
                label: 'CONNECTIONS',
                style: instance.generalSettings.connectionNotify ? SUCCESS : DANGER
            }),
            getButton({
                customId: 'InGameTeammateAfk',
                label: 'AFK',
                style: instance.generalSettings.afkNotify ? SUCCESS : DANGER
            }),
            getButton({
                customId: 'InGameTeammateDeath',
                label: 'DEATH',
                style: instance.generalSettings.deathNotify ? SUCCESS : DANGER
            }));
    },

    getFcmAlarmNotificationButtons: function (enabled, everyone) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'FcmAlarmNotification',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }),
            getButton({
                customId: 'FcmAlarmNotificationEveryone',
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }));
    },

    getSmartAlarmNotifyInGameButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'SmartAlarmNotifyInGame',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getLeaderCommandEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'LeaderCommandEnabled',
                label: enabled ? 'ENABLED' : 'DISABLED',
                style: enabled ? SUCCESS : DANGER
            }));
    },

    getTrackerNotifyButtons: function (allOffline, anyOnline) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: 'TrackerNotifyAllOffline',
                label: 'ALL OFFLINE',
                style: allOffline ? SUCCESS : DANGER
            }),
            getButton({
                customId: 'TrackerNotifyAnyOnline',
                label: 'ANY ONLINE',
                style: anyOnline ? SUCCESS : DANGER
            }));
    },

    getServerButtons: function (guildId, id, state = null) {
        const instance = Client.client.readInstanceFile(guildId);

        if (state === null) state = (instance.serverList[id].active) ? 1 : 0;

        let connectionButton = null;
        if (state === 0) {
            connectionButton = getButton({
                customId: `ServerConnectId${id}`,
                label: 'CONNECT',
                style: PRIMARY
            });
        }
        else if (state === 1) {
            connectionButton = getButton({
                customId: `ServerDisconnectId${id}`,
                label: 'DISCONNECT',
                style: DANGER
            });
        }
        else if (state === 2) {
            connectionButton = getButton({
                customId: `ServerReconnectingId${id}`,
                label: 'RECONNECTING...',
                style: DANGER
            });
        }

        let trackerButton = getButton({
            customId: `CreateTrackerId${id}`,
            label: 'CREATE TRACKER',
            style: PRIMARY
        });
        let linkButton = getButton({
            label: 'WEBSITE',
            style: LINK,
            url: instance.serverList[id].url
        });
        let deleteButton = getButton({
            customId: `ServerDeleteId${id}`,
            style: SECONDARY,
            emoji: '🗑️'
        });

        if (instance.serverList[id].battlemetricsId !== null) {
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
            getButton({
                customId: `TrackerActiveId${trackerName}`,
                label: active ? 'ACTIVE' : 'INACTIVE',
                style: active ? SUCCESS : DANGER
            }),
            getButton({
                customId: `TrackerEveryoneId${trackerName}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            getButton({
                customId: `TrackerDeleteId${trackerName}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartAlarmButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        const everyone = instance.alarms[id].everyone;
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `SmartAlarmEveryoneId${id}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            getButton({
                customId: `SmartAlarmDeleteId${id}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorToolCupboardButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        const everyone = instance.storageMonitors[id].everyone;
        const inGame = instance.storageMonitors[id].inGame;
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `StorageMonitorToolCupboardEveryoneId${id}`,
                label: '@everyone',
                style: everyone ? SUCCESS : DANGER
            }),
            getButton({
                customId: `StorageMonitorToolCupboardInGameId${id}`,
                label: 'IN-GAME',
                style: inGame ? SUCCESS : DANGER
            }),
            getButton({
                customId: `StorageMonitorToolCupboardDeleteId${id}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getStorageMonitorContainerButton: function (id) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `StorageMonitorContainerDeleteId${id}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },

    getSmartSwitchGroupButtons: function (name) {
        return new Discord.ActionRowBuilder().addComponents(
            getButton({
                customId: `TurnOnGroupId${name}`,
                label: 'TURN ON',
                style: PRIMARY
            }),
            getButton({
                customId: `TurnOffGroupId${name}`,
                label: 'TURN OFF',
                style: PRIMARY
            }),
            getButton({
                customId: `DeleteGroupId${name}`,
                style: SECONDARY,
                emoji: '🗑️'
            }));
    },
}