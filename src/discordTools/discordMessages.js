const Discord = require('discord.js');

const Client = require('../../index.js');
const DiscordButtons = require('./discordButtons.js');
const DiscordEmbeds = require('./discordEmbeds.js');
const DiscordSelectMenus = require('./discordSelectMenus.js');
const DiscordTools = require('./discordTools.js');

module.exports = {
    sendMessage: async function (guildId, content, messageId, channelId, interaction = null) {
        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        let message = messageId !== null ?
            await DiscordTools.getMessageById(guildId, channelId, messageId) : undefined;

        if (message !== undefined) {
            return await Client.client.messageEdit(message, content);
        }
        else {
            const channel = DiscordTools.getTextChannelById(guildId, channelId);

            if (!channel) {
                Client.client.log('ERROR', `Could not get channel with id: ${channelId}.`, 'error');
                return;
            }

            return await Client.client.messageSend(channel, content);
        }
    },

    sendServerMessage: async function (guildId, id, state = null, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getServerEmbed(guildId, id)],
            components: [DiscordButtons.getServerButtons(guildId, id, state)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.serverList[id].messageId, instance.channelId.servers, interaction);

        if (!interaction) {
            instance.serverList[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendTrackerMessage: async function (guildId, trackerName, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [DiscordEmbeds.getTrackerEmbed(guildId, trackerName)],
            components: [DiscordButtons.getTrackerButtons(guildId, trackerName)]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.trackers[trackerName].messageId, instance.channelId.trackers, interaction);

        if (!interaction) {
            instance.trackers[trackerName].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    sendSmartSwitchMessage: async function (guildId, id, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const content = {
            embeds: [instance.switches[id].reachable ?
                DiscordEmbeds.getSmartSwitchEmbed(guildId, id) :
                DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'switches')],
            components: [
                DiscordSelectMenus.getSmartSwitchSelectMenu(guildId, id),
                DiscordButtons.getSmartSwitchButtons(guildId, id)
            ],
            files: [
                new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`)
            ]
        }

        const message = await module.exports.sendMessage(
            guildId, content, instance.switches[id].messageId, instance.channelId.switches, interaction);

        if (!interaction) {
            instance.switches[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },
}