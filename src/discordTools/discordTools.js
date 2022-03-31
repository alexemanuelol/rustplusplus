const { MessageActionRow, MessageButton, MessageSelectMenu, Permissions, MessageEmbed, MessageAttachment } = require('discord.js');
const Client = require('../../index.js');

module.exports = {
    getGuild: function (guildId) {
        return Client.client.guilds.cache.get(guildId);
    },

    getTextChannelById: function (guildId, channelId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = guild.channels.cache.get(channelId);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getTextChannelByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = guild.channels.cache.find(c => c.name === name);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getCategoryById: function (guildId, categoryId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const category = guild.channels.cache.get(categoryId);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getCategoryByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const category = guild.channels.cache.find(c => c.name === name);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getMessageById: async function (guildId, channelId, messageId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = guild.channels.cache.get(channelId);

            if (channel) {
                try {
                    return await channel.messages.fetch(messageId);
                }
                catch (e) {
                    return undefined;
                }
            }
        }
        return undefined;
    },

    addCategory: async function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            return await guild.channels.create(name, {
                type: 'GUILD_CATEGORY',
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.SEND_MESSAGES]
                }]
            });
        }
    },

    addTextChannel: async function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            return await guild.channels.create(name, {
                type: 'GUILD_TEXT',
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.SEND_MESSAGES]
                }],
            });
        }
    },

    clearTextChannel: async function (guildId, channelId, numberOfMessages) {
        const channel = module.exports.getTextChannelById(guildId, channelId);

        if (channel) {
            for (let messagesLeft = numberOfMessages; messagesLeft > 0; messagesLeft -= 100) {
                if (messagesLeft >= 100) {
                    await channel.bulkDelete(100, true);
                }
                else {
                    await channel.bulkDelete(messagesLeft, true);
                }
            }

            /* Fix for messages older than 14 days */
            let messages = await channel.messages.fetch({ limit: 100 });
            for (let message of messages) {
                message = message[1];
                if (!message.author.bot) {
                    break;
                }

                try {
                    await message.delete();
                }
                catch (e) {

                }
            }
        }
    },

    getNotificationButtons: function (setting, discordActive, inGameActive) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${setting}DiscordNotification`)
                    .setLabel('DISCORD')
                    .setStyle((discordActive) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${setting}InGameNotification`)
                    .setLabel('IN-GAME')
                    .setStyle((inGameActive) ? 'SUCCESS' : 'DANGER'))
    },

    getTrademarkButton: function (enabled) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('showTrademark')
                    .setLabel((enabled) ? 'SHOWING' : 'NOT SHOWING')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'))
    },

    getInGameCommandsEnabledButton: function (enabled) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('allowInGameCommands')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'))
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
    },

    getServerEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageEmbed()
            .setTitle(`${instance.serverList[id].title}`)
            .setColor('#ce412b')
            .setDescription(`${instance.serverList[id].description}`)
            .setThumbnail(`${instance.serverList[id].img}`);
    },

    getServerButtons: function (guildId, id, state = null) {
        const instance = Client.client.readInstanceFile(guildId);

        if (state === null) {
            state = (instance.serverList[id].active) ? 1 : 0;
        }

        let customId = null;
        let label = null;
        let style = null;

        switch (state) {
            case 0: /* CONNECT */
                customId = `${id}ServerConnect`;
                label = 'CONNECT';
                style = 'PRIMARY';
                break;

            case 1: /* DISCONNECT */
                customId = `${id}ServerDisconnect`;
                label = 'DISCONNECT';
                style = 'DANGER';
                break;

            case 2: /* RECONNECTING */
                customId = `${id}ServerReconnecting`;
                label = 'RECONNECTING...';
                style = 'DANGER';
                break;

            default:
                break;
        }

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(customId)
                    .setLabel(label)
                    .setStyle(style),
                new MessageButton()
                    .setStyle('LINK')
                    .setLabel('WEBSITE')
                    .setURL(instance.serverList[id].url),
                new MessageButton()
                    .setCustomId(`${id}ServerDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },

    sendServerMessage: async function (guildId, id, state = null, e = true, c = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const embed = module.exports.getServerEmbed(guildId, id);
        const buttons = module.exports.getServerButtons(guildId, id, state);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }

        if (interaction) {
            try {
                await interaction.update(content);
            }
            catch (e) {
                Client.client.log('ERROR', `Unknown interaction`, 'error');
            }
            return;
        }

        let messageId = instance.serverList[id].messageId;
        let message = undefined;
        if (messageId !== null) {
            message = await module.exports.getMessageById(guildId, instance.channelId.servers, messageId);
        }

        if (message !== undefined) {
            try {
                await message.edit(content);
            }
            catch (e) {
                Client.client.log('ERROR', `While editing server message: ${e}`, 'error');
                return;
            }
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.servers);

            if (!channel) {
                Client.client.log('ERROR', 'sendServerMessage: Invalid guild or channel.', 'error');
                return;
            }

            message = await channel.send(content);
            instance.serverList[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    getSmartSwitchEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageEmbed()
            .setTitle(`${instance.switches[id].name}`)
            .setColor((instance.switches[id].active) ? '#00ff40' : '#ff0040')
            .setDescription(`ID: \`${id}\``)
            .setThumbnail(`attachment://${instance.switches[id].image}`)
            .addFields(
                {
                    name: 'Custom Command',
                    value: `${instance.generalSettings.prefix}${instance.switches[id].command}`, inline: true
                }
            )
            .setFooter({ text: `${instance.switches[id].server}` })
    },

    getSmartSwitchSelectMenu: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        let autoDayNightString = 'AUTO SETTING: ';
        switch (instance.switches[id].autoDayNight) {
            case 0:
                autoDayNightString += 'OFF';
                break;

            case 1:
                autoDayNightString += 'AUTO-DAY';
                break;

            case 2:
                autoDayNightString += 'AUTO-NIGHT';
                break;

            default:
                break;
        }

        return new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(`${id}AutoDayNight`)
                    .setPlaceholder(`${autoDayNightString}`)
                    .addOptions([
                        {
                            label: 'OFF',
                            description: 'Smart Switch work as normal.',
                            value: '0',
                        },
                        {
                            label: 'AUTO-DAY',
                            description: 'Smart Switch will be active only during the day.',
                            value: '1',
                        },
                        {
                            label: 'AUTO-NIGHT',
                            description: 'Smart Switch will be active only during the night.',
                            value: '2',
                        },
                    ]),
            );
    },

    getSmartSwitchButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${id}${(instance.switches[id].active) ? 'Off' : 'On'}SmartSwitch`)
                    .setLabel((instance.switches[id].active) ? 'TURN OFF' : 'TURN ON')
                    .setStyle((instance.switches[id].active) ? 'DANGER' : 'SUCCESS'),
                new MessageButton()
                    .setCustomId(`${id}SmartSwitchDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY')
            )

    },

    sendSmartSwitchMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new MessageAttachment(`src/resources/images/electrics/${instance.switches[id].image}`);
        const embed = module.exports.getSmartSwitchEmbed(guildId, id);
        const selectMenu = module.exports.getSmartSwitchSelectMenu(guildId, id);
        const buttons = module.exports.getSmartSwitchButtons(guildId, id);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [selectMenu, buttons];
        }
        if (f) {
            content.files = [file];
        }

        if (interaction) {
            await interaction.update(content);
            return;
        }

        if (Client.client.switchesMessages[guildId][id]) {
            try {
                await Client.client.switchesMessages[guildId][id].edit(content);
            }
            catch (e) {
                Client.client.log('ERROR', `While editing smart switch message: ${e}`, 'error');
                return;
            }
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.switches);

            if (!channel) {
                Client.client.log('ERROR', 'sendSmartSwitchMessage: Invalid guild or channel.', 'error');
                return;
            }
            Client.client.switchesMessages[guildId][id] = await channel.send(content);
        }
    },
}