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
        await DiscordTools.clearTextChannel(guild.id, instance.channelId.settings, 100);

        await setupGeneralSettings(instance, channel);
        await setupNotificationSettings(instance, channel);

        instance.firstTime = false;
        client.writeInstanceFile(guild.id, instance);
    }

};

async function setupGeneralSettings(instance, channel) {
    await channel.send({ files: [new MessageAttachment('src/resources/images/general_settings_logo.png')] });

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
            new MessageAttachment('src/resources/images/settings_logo.png')
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
            DiscordTools.getTrademarkButton(instance.generalSettings.showTrademark)
        ],
        files: [
            new MessageAttachment('src/resources/images/settings_logo.png')
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
            DiscordTools.getInGameCommandsEnabledButton(instance.generalSettings.inGameCommandsEnabled)
        ],
        files: [
            new MessageAttachment('src/resources/images/settings_logo.png')
        ]
    });

    await channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#861c0c')
                .setTitle('Should Smart Alarms notify even if they are not setup on the connected rust server?')
                .addFields(
                    { name: 'NOTE', value: '- These Alarm notifications will use the title and message given to the Smart Alarm in-game.\n- These Smart Alarms might not be available in the alarms text channel in discord.', inline: true }
                )
                .setThumbnail(`attachment://settings_logo.png`)
        ],
        components: [
            DiscordTools.getFcmAlarmNotificationButtons(
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)
        ],
        files: [
            new MessageAttachment('src/resources/images/settings_logo.png')
        ]
    });
}

async function setupNotificationSettings(instance, channel) {
    await channel.send({ files: [new MessageAttachment('src/resources/images/notification_settings_logo.png')] });

    for (let setting in instance.notificationSettings) {
        await channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#861c0c')
                    .setTitle(instance.notificationSettings[setting].description)
                    .setThumbnail(`attachment://${instance.notificationSettings[setting].image}`)
            ],
            components: [
                DiscordTools.getNotificationButtons(
                    setting,
                    instance.notificationSettings[setting].discord,
                    instance.notificationSettings[setting].inGame)
            ],
            files: [
                new MessageAttachment(`src/resources/images/events/${instance.notificationSettings[setting].image}`)
            ]
        });
    }
}