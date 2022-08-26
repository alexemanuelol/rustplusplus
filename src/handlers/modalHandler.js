const Discord = require('discord.js');

const DiscordButtons = require('../discordTools/discordButtons.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordSelectMenus = require('../discordTools/discordSelectMenus.js');

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
            const content = {
                embeds: [DiscordEmbeds.getSmartSwitchEmbed(guildId, id)],
                components: [
                    DiscordSelectMenus.getSmartSwitchSelectMenu(guildId, id),
                    DiscordButtons.getSmartSwitchButtons(guildId, id)
                ],
                files: [new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`)]
            }

            await client.messageEdit(client.switchesMessages[guildId][id], content);
        }
    }

    interaction.deferUpdate();
}