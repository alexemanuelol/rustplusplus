const CommandHandler = require('../handlers/inGameCommandHandler.js');
const TeamChatHandler = require("../handlers/teamChatHandler.js");
const DiscordTools = require('../discordTools/discordTools.js');
const TeamHandler = require('../handlers/teamHandler.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'message',
    async execute(rustplus, client, message) {
        /* rustplus.log('MESSAGE', 'MESSAGE RECEIVED'); */
        let instance = client.readInstanceFile(rustplus.guildId);

        if (message.hasOwnProperty('response')) {

        }
        else if (message.hasOwnProperty('broadcast')) {
            if (message.broadcast.hasOwnProperty('teamChanged')) {
                TeamHandler.handler(rustplus, client, message.broadcast.teamChanged.teamInfo);
                rustplus.team.updateTeam(message.broadcast.teamChanged.teamInfo);
            }
            else if (message.broadcast.hasOwnProperty('teamMessage')) {
                /* Let command handler handle the potential command */
                let handled = await CommandHandler.inGameCommandHandler(rustplus, client, message);

                if (!handled) {
                    TeamChatHandler(rustplus, client, message.broadcast.teamMessage.message);
                }
            }
            else if (message.broadcast.hasOwnProperty('entityChanged')) {
                let id = message.broadcast.entityChanged.entityId;

                if (instance.switches.hasOwnProperty(id)) {
                    if (rustplus.interactionSwitches.hasOwnProperty(id)) {
                        delete rustplus.interactionSwitches[id];
                    }
                    else {
                        let active = message.broadcast.entityChanged.payload.value;
                        instance.switches[id].active = active;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        DiscordTools.sendSmartSwitchMessage(rustplus.guildId, id, true, true, false);
                    }
                }
                else if (instance.alarms.hasOwnProperty(id)) {
                    let active = message.broadcast.entityChanged.payload.value;
                    instance.alarms[id].active = active;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    if (active) {
                        let title = instance.alarms[id].name;
                        let message = instance.alarms[id].message;

                        let content = {};
                        content.embeds = [
                            new MessageEmbed()
                                .setColor('#ce412b')
                                .setThumbnail(`attachment://${instance.alarms[id].image}`)
                                .setTitle(title)
                                .addFields(
                                    { name: 'ID', value: `\`${id}\``, inline: true },
                                    { name: 'Message', value: `\`${message}\``, inline: true }
                                )
                                .setFooter({
                                    text: instance.alarms[id].server
                                })
                                .setTimestamp()];

                        content.files = [
                            new MessageAttachment(`src/resources/images/electrics/${instance.alarms[id].image}`)];

                        if (instance.alarms[id].everyone) {
                            content.content = '@everyone';
                        }

                        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.activity);
                        if (channel) {
                            await channel.send(content);
                        }

                        if (instance.generalSettings.smartAlarmNotifyInGame) {
                            rustplus.sendTeamMessageAsync(`${title}: ${message}`, !rustplus.generalSettings.showTrademark);
                        }
                    }

                    DiscordTools.sendSmartAlarmMessage(rustplus.guildId, id, true, false, false);
                }
                else if (instance.storageMonitors.hasOwnProperty(id)) {
                    if (message.broadcast.entityChanged.payload.value === true) return;

                    if (instance.storageMonitors[id].type === 'toolcupboard') {
                        setTimeout(async () => {
                            let info = await rustplus.getEntityInfoAsync(id);
                            if (info.error) return;

                            rustplus.storageMonitors[id] = {
                                items: info.entityInfo.payload.items,
                                expiry: info.entityInfo.payload.protectionExpiry
                            }

                            let instance = client.readInstanceFile(rustplus.guildId);
                            if (info.entityInfo.payload.protectionExpiry === 0 &&
                                instance.storageMonitors[id].decaying === false) {
                                instance.storageMonitors[id].decaying = true;
                                client.writeInstanceFile(rustplus.guildId, instance);

                                await DiscordTools.sendDecayingNotification(rustplus.guildId, id);

                                if (instance.storageMonitors[id].inGame) {
                                    rustplus.sendTeamMessageAsync(
                                        `${instance.storageMonitors[id].name} is decaying!`,
                                        !rustplus.generalSettings.showTrademark);
                                }
                            }
                            else if (info.entityInfo.payload.protectionExpiry !== 0) {
                                instance.storageMonitors[id].decaying = false;
                                client.writeInstanceFile(rustplus.guildId, instance);
                            }

                            await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, id, true, false, false);

                        }, 2000);
                    }
                    else {
                        rustplus.storageMonitors[id] = {
                            items: message.broadcast.entityChanged.payload.items,
                            expiry: message.broadcast.entityChanged.payload.protectionExpiry
                        }

                        await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, id, true, false, false);
                    }
                }
            }
        }
    },
};