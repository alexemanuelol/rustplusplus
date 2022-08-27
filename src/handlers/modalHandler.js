const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);

    if (interaction.customId.startsWith('SmartSwitchEdit')) {
        let id = interaction.customId.replace('SmartSwitchEditId', '');
        let smartSwitchName = interaction.fields.getTextInputValue('SmartSwitchName');
        let smartSwitchCommand = interaction.fields.getTextInputValue('SmartSwitchCommand');

        let changed = false;
        if (smartSwitchName !== instance.switches[id].name) {
            instance.switches[id].name = smartSwitchName;
            changed = true;
        }
        if (smartSwitchCommand !== instance.switches[id].command) {
            instance.switches[id].command = smartSwitchCommand;
            changed = true;
        }
        client.writeInstanceFile(guildId, instance);

        if (changed) {
            await DiscordMessages.sendSmartSwitchMessage(guildId, id);
        }
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
            await DiscordTools.sendSmartAlarmMessage(interaction.guildId, id);
        }
    }

    interaction.deferUpdate();
}