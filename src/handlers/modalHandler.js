const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;

    if (interaction.customId.startsWith('SmartSwitchEdit')) {
        let id = interaction.customId.replace('SmartSwitchEditId', '');
        let smartSwitchName = interaction.fields.getTextInputValue('SmartSwitchName');
        let smartSwitchCommand = interaction.fields.getTextInputValue('SmartSwitchCommand');

        if (smartSwitchName !== instance.switches[id].name) {
            instance.switches[id].name = smartSwitchName;
        }

        if (smartSwitchCommand !== instance.switches[id].command) {
            const rustplus = client.rustplusInstances[guildId];
            if (!rustplus || (rustplus && !rustplus.ready)) {
                client.log('WARNING', 'Not currently connected to a rust server.');
            }
            else if (Keywords.getListOfUsedKeywords(client, guildId, rustplus.serverId).includes(smartSwitchCommand)) {
                rustplus.log('WARNING', `The command '${smartSwitchCommand}' is already in use.`);
            }
            else {
                instance.switches[id].command = smartSwitchCommand;
            }
        }
        client.writeInstanceFile(guildId, instance);

        await DiscordMessages.sendSmartSwitchMessage(guildId, id);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        let id = interaction.customId.replace('SmartAlarmEditId', '');
        let smartAlarmName = interaction.fields.getTextInputValue('SmartAlarmName');
        let smartAlarmMessage = interaction.fields.getTextInputValue('SmartAlarmMessage');

        let changed = false;
        if (smartAlarmName !== instance.alarms[id].name) {
            instance.alarms[id].name = smartAlarmName;
            changed = true;
        }
        if (smartAlarmMessage !== instance.alarms[id].message) {
            instance.alarms[id].message = smartAlarmMessage;
            changed = true;
        }
        client.writeInstanceFile(guildId, instance);

        if (changed) {
            await DiscordMessages.sendSmartAlarmMessage(interaction.guildId, id);
        }
    }

    interaction.deferUpdate();
}