const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

module.exports = {
    getChannel: function (client, guildId, channelId) {
        let guild = client.guilds.cache.get(guildId);
        if (guild) {
            let channel = guild.channels.cache.get(channelId);
            return channel;
        }
        return guild;
    },

    clearTextChannel: function (channel, numberOfMessages) {
        if (channel === undefined) {
            return;
        }

        for (let messagesLeft = numberOfMessages; messagesLeft > 0; messagesLeft -= 100) {
            if (messagesLeft >= 100) {
                channel.bulkDelete(100, true);
            }
            else {
                channel.bulkDelete(messagesLeft, true);
            }
        }
    },

    getNotificationButtonsRow: function (discordId, discordActive, inGameId, inGameActive) {
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

    getPrefixSelectMenu: function (currentPrefix) {
        return new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('prefix')
                    .setPlaceholder(`Current Prefix: ${currentPrefix}`)
                    .addOptions([
                        {
                            label: '!',
                            description: 'Exclamation Mark',
                            value: '!',
                        },
                        {
                            label: '/',
                            description: 'Slash',
                            value: '/',
                        },
                        {
                            label: '.',
                            description: 'Dot',
                            value: '.',
                        },
                    ])
            );
    }
}