const { MessageEmbed, MessageAttachment } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.settings);

    if (!channel) {
        client.log('ERROR', 'SetupSettingsMenu: Invalid guild or channel.', 'error');
        return;
    }

    if (instance.firstTime) {
        DiscordTools.clearTextChannel(guild.id, instance.channelId.settings, 100);

        await setupGeneralSettings(instance, channel);
        await setupNotificationSettings(instance, channel);

        instance.firstTime = false;
        client.writeInstanceFile(guild.id, instance);
    }

};

async function setupGeneralSettings(instance, channel) {
    await channel.send({ files: [new MessageAttachment('src/images/general_settings_logo.png')] });

    await channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#861c0c')
                .setTitle('Select what in-game command prefix that should be used:')
                .setThumbnail(`attachment://settings_logo.png`)
        ],
        components: [
            DiscordTools.getPrefixSelectMenu(instance.generalSettings.prefix)
        ],
        files: [
            new MessageAttachment('src/images/settings_logo.png')
        ]
    });

    await channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#861c0c')
                .setTitle(`Should the 'rustPlusPlus' trademark be shown for in-game bot messages?`)
                .setThumbnail(`attachment://settings_logo.png`)
        ],
        components: [
            DiscordTools.getTrademarkButtonsRow(instance.generalSettings.showTrademark)
        ],
        files: [
            new MessageAttachment('src/images/settings_logo.png')
        ]
    });

    await channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#861c0c')
                .setTitle('Should in-game commands be enabled?')
                .setThumbnail(`attachment://settings_logo.png`)
        ],
        components: [
            DiscordTools.getInGameCommandsEnabledButtonsRow(instance.generalSettings.inGameCommandsEnabled)
        ],
        files: [
            new MessageAttachment('src/images/settings_logo.png')
        ]
    });
}

async function setupNotificationSettings(instance, channel) {
    await channel.send({ files: [new MessageAttachment('src/images/notification_settings_logo.png')] });

    for (let setting in instance.notificationSettings) {
        await channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#861c0c')
                    .setTitle(instance.notificationSettings[setting].description)
                    .setThumbnail(`attachment://${instance.notificationSettings[setting].image}`)
            ],
            components: [
                DiscordTools.getNotificationButtonsRow(
                    setting,
                    instance.notificationSettings[setting].discord,
                    instance.notificationSettings[setting].inGame)
            ],
            files: [
                new MessageAttachment(`src/images/${instance.notificationSettings[setting].image}`)
            ]
        });
    }
}