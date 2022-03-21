const DiscordTools = require('../discordTools/discordTools.js');
const { MessageAttachment } = require('discord.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    if (interaction.customId.endsWith('DiscordNotification')) {
        let setting = interaction.customId.replace('DiscordNotification', '');
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;

        if (rustplus) {
            rustplus.notificationSettings[setting].discord = instance.notificationSettings[setting].discord;
        }

        let row = DiscordTools.getNotificationButtonsRow(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await interaction.update({ components: [row] });
    }
    else if (interaction.customId.endsWith('InGameNotification')) {
        let setting = interaction.customId.replace('InGameNotification', '');
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;

        if (rustplus) {
            rustplus.notificationSettings[setting].inGame = instance.notificationSettings[setting].inGame;
        }

        let row = DiscordTools.getNotificationButtonsRow(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);

        await interaction.update({ components: [row] });
    }
    else if (interaction.customId === 'showTrademark') {
        instance.generalSettings.showTrademark = !instance.generalSettings.showTrademark;

        if (rustplus) {
            rustplus.generalSettings.showTrademark = instance.generalSettings.showTrademark;
        }

        let row = DiscordTools.getTrademarkButtonsRow(instance.generalSettings.showTrademark);

        await interaction.update({ components: [row] });
    }
    else if (interaction.customId === 'allowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;

        if (rustplus) {
            rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;
        }

        let row = DiscordTools.getInGameCommandsEnabledButtonsRow(instance.generalSettings.inGameCommandsEnabled);

        await interaction.update({ components: [row] });
    }
    else if (interaction.customId.endsWith('ServerConnect')) {
        let server = interaction.customId.replace('ServerConnect', '');

        for (const [key, value] of Object.entries(instance.serverList)) {
            if (value.active) {
                instance.serverList[key].active = false;
                let row = DiscordTools.getServerButtonsRow(key, 0, instance.serverList[key].url);

                let messageId = instance.serverList[key].messageId;
                let message = await DiscordTools.getMessageById(guildId, instance.channelId.servers, messageId);
                if (message !== undefined) {
                    await message.edit({ components: [row] });
                }
                break;
            }
        }

        instance.serverList[server].active = true;
        let row = DiscordTools.getServerButtonsRow(server, 1, instance.serverList[server].url);
        await interaction.update({ components: [row] });

        /* Disconnect previous instance is any */
        if (rustplus) {
            rustplus.disconnect();
        }

        /* Create the rustplus instance */
        client.createRustplusInstance(
            guildId,
            instance.serverList[server].serverIp,
            instance.serverList[server].appPort,
            instance.serverList[server].steamId,
            instance.serverList[server].playerToken
        );
    }
    else if (interaction.customId.endsWith('ServerDisconnect') ||
        interaction.customId.endsWith('ServerReconnecting')) {
        let server = interaction.customId.replace('ServerDisconnect', '');
        server = server.replace('ServerReconnecting', '');

        instance.serverList[server].active = false;
        let row = DiscordTools.getServerButtonsRow(server, 0, instance.serverList[server].url);
        await interaction.update({ components: [row] });

        /* Disconnect previous instance if any */
        if (rustplus) {
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.endsWith('ServerDelete')) {
        let server = interaction.customId.replace('ServerDelete', '');

        if (instance.serverList[server].active) {
            if (rustplus) {
                rustplus.disconnect();
                rustplus.deleted = true;
                delete client.rustplusInstances[guildId];
            }
        }

        let messageId = instance.serverList[server].messageId;
        let message = await DiscordTools.getMessageById(guildId, instance.channelId.servers, messageId);
        if (message !== undefined) {
            await message.delete();
        }

        delete instance.serverList[server];

        /* Remove all Smart Switches assosiated with this server */
        for (const [key, value] of Object.entries(instance.switches)) {
            if (`${value.ipPort}` === server) {
                delete instance.switches[key];
            }
        }
    }
    else if (interaction.customId.endsWith('SmartSwitch')) {
        let id = interaction.customId.replace('OnSmartSwitch', '').replace('OffSmartSwitch', '');

        if (!instance.switches.hasOwnProperty(id)) {
            await client.switchesMessages[guildId][id].delete();
            delete client.switchesMessages[guildId][id];
            return;
        }

        let active = (interaction.customId.endsWith('OnSmartSwitch')) ? true : false;
        let prefix = rustplus.generalSettings.prefix;

        instance.switches[id].active = active;

        let sw = instance.switches[id];

        let file = new MessageAttachment(`src/images/electrics/${sw.image}`);
        let embed = DiscordTools.getSwitchEmbed(id, sw, prefix);

        let selectMenu = DiscordTools.getSwitchSelectMenu(id, sw);
        let buttonRow = DiscordTools.getSwitchButtonsRow(id, sw);

        rustplus.interactionSwitches[id] = active;

        if (active) {
            client.rustplusInstances[interaction.guildId].turnSmartSwitchOn(id, async (msg) => {
                await interaction.update({ embeds: [embed], components: [selectMenu, buttonRow], files: [file] });
            });
        }
        else {
            client.rustplusInstances[interaction.guildId].turnSmartSwitchOff(id, async (msg) => {
                await interaction.update({ embeds: [embed], components: [selectMenu, buttonRow], files: [file] });
            });
        }
    }
    else if (interaction.customId.endsWith('SmartSwitchDelete')) {
        let id = interaction.customId.replace('SmartSwitchDelete', '');

        delete instance.switches[id];

        await client.switchesMessages[guildId][id].delete();
        delete client.switchesMessages[guildId][id];
    }

    client.writeInstanceFile(guildId, instance);
}
