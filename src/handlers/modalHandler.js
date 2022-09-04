const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;

    if (interaction.customId.startsWith('SmartSwitchEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchEdit', ''));

        const smartSwitchName = interaction.fields.getTextInputValue('SmartSwitchName');
        const smartSwitchCommand = interaction.fields.getTextInputValue('SmartSwitchCommand');

        if (smartSwitchName !== instance.serverList[ids.serverId].switches[ids.entityId].name) {
            instance.serverList[ids.serverId].switches[ids.entityId].name = smartSwitchName;
        }

        if (smartSwitchCommand !== instance.serverList[ids.serverId].switches[ids.entityId].command) {
            const rustplus = client.rustplusInstances[guildId];
            if (!rustplus || (rustplus && !rustplus.ready)) {
                client.log('WARNING', 'Not currently connected to a rust server.');
            }
            else if (Keywords.getListOfUsedKeywords(client, guildId, rustplus.serverId).includes(smartSwitchCommand)) {
                rustplus.log('WARNING', `The command '${smartSwitchCommand}' is already in use.`);
            }
            else {
                instance.serverList[ids.serverId].switches[ids.entityId].command = smartSwitchCommand;
            }
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));
        let smartAlarmName = interaction.fields.getTextInputValue('SmartAlarmName');
        let smartAlarmMessage = interaction.fields.getTextInputValue('SmartAlarmMessage');

        let changed = false;
        if (smartAlarmName !== instance.serverList[ids.serverId].alarms[ids.entityId].name) {
            instance.serverList[ids.serverId].alarms[ids.entityId].name = smartAlarmName;
            changed = true;
        }
        if (smartAlarmMessage !== instance.serverList[ids.serverId].alarms[ids.entityId].message) {
            instance.serverList[ids.serverId].alarms[ids.entityId].message = smartAlarmMessage;
            changed = true;
        }
        client.writeInstanceFile(guildId, instance);

        if (changed) {
            await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, ids.serverId, ids.entityId);
        }
    }
    else if (interaction.customId.startsWith('TrackerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEdit', ''));
        const trackerName = interaction.fields.getTextInputValue('TrackerName');

        instance.trackers[ids.trackerId].name = trackerName;
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }
    else if (interaction.customId.startsWith('TrackerAddPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayer', ''));
        const steamId = interaction.fields.getTextInputValue('TrackerAddPlayerSteamId');

        if (instance.trackers[ids.trackerId].players.some(e => e.steamId === steamId)) {
            interaction.deferUpdate();
            return;
        }

        instance.trackers[ids.trackerId].players.push({
            name: '-', steamId: steamId, playerId: null, status: false, time: null
        });
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);

        /* To force search of player name via scrape */
        client.battlemetricsIntervalCounter = 0;
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayer', ''));
        const steamId = interaction.fields.getTextInputValue('TrackerRemovePlayerSteamId');

        if (!instance.trackers[ids.trackerId].players.some(e => e.steamId === steamId)) {
            interaction.deferUpdate();
            return;
        }

        instance.trackers[ids.trackerId].players =
            instance.trackers[ids.trackerId].players.filter(e => e.steamId !== steamId);
        client.writeInstanceFile(interaction.guildId, instance);

        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }

    interaction.deferUpdate();
}