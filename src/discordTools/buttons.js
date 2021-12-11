const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    getSettingsButtonsRow: function (discordId, discordActive, inGameId, inGameActive) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(discordId)
                    .setLabel('DISCORD')
                    .setStyle((discordActive) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(inGameId)
                    .setLabel('IN-GAME')
                    .setStyle((inGameActive) ? 'SUCCESS' : 'DANGER'))
    },
}