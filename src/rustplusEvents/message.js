const CommandHandler = require('../handlers/inGameCommandHandler.js');
const TeamChatHandler = require("../handlers/teamChatHandler.js");
const DiscordTools = require('../discordTools/discordTools.js');
const TeamHandler = require('../handlers/teamHandler.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');

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
                message.broadcast.teamMessage.message.message =
                    message.broadcast.teamMessage.message.message.replace(
                        /^<color.+?<\/color>/g, '');

                let handled = await CommandHandler.inGameCommandHandler(rustplus, client, message);

                if (!handled) {
                    TeamChatHandler(rustplus, client, message.broadcast.teamMessage.message);
                }
            }
            else if (message.broadcast.hasOwnProperty('entityChanged')) {
                let entityId = message.broadcast.entityChanged.entityId;

                if (instance.switches.hasOwnProperty(entityId)) {
                    if (rustplus.interactionSwitches.includes(`${entityId}`)) {
                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== `${entityId}`);
                    }
                    else {
                        let active = message.broadcast.entityChanged.payload.value;
                        instance.switches[entityId].active = active;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        DiscordTools.sendSmartSwitchMessage(rustplus.guildId, entityId, true, true, false);
                        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                            client, rustplus.guildId, rustplus.serverId, entityId);
                    }
                }
                else if (instance.alarms.hasOwnProperty(entityId)) {
                    let active = message.broadcast.entityChanged.payload.value;
                    instance.alarms[entityId].active = active;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    if (active) {
                        let title = instance.alarms[entityId].name;
                        let message = instance.alarms[entityId].message;

                        let content = {};
                        content.embeds = [
                            new MessageEmbed()
                                .setColor('#ce412b')
                                .setThumbnail(`attachment://${instance.alarms[entityId].image}`)
                                .setTitle(title)
                                .addFields(
                                    { name: 'ID', value: `\`${entityId}\``, inline: true },
                                    { name: 'Message', value: `\`${message}\``, inline: true }
                                )
                                .setFooter({ text: instance.alarms[entityId].server })
                                .setTimestamp()];

                        content.files = [
                            new MessageAttachment(
                                `src/resources/images/electrics/${instance.alarms[entityId].image}`)];

                        if (instance.alarms[entityId].everyone) {
                            content.content = '@everyone';
                        }

                        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.activity);
                        if (channel) {
                            await client.messageSend(channel, content);
                        }

                        if (instance.generalSettings.smartAlarmNotifyInGame) {
                            rustplus.sendTeamMessageAsync(`${title}: ${message}`);
                        }
                    }

                    DiscordTools.sendSmartAlarmMessage(rustplus.guildId, entityId, true, false, false);
                }
                else if (instance.storageMonitors.hasOwnProperty(entityId)) {
                    if (message.broadcast.entityChanged.payload.value === true) return;

                    if (instance.storageMonitors[entityId].type === 'toolcupboard' ||
                        message.broadcast.entityChanged.payload.capacity === 28) {
                        setTimeout(async () => {
                            let info = await rustplus.getEntityInfoAsync(entityId);
                            if (!(await rustplus.isResponseValid(info))) return;

                            rustplus.storageMonitors[entityId] = {
                                items: info.entityInfo.payload.items,
                                expiry: info.entityInfo.payload.protectionExpiry,
                                capacity: info.entityInfo.payload.capacity,
                                hasProtection: info.entityInfo.payload.hasProtection
                            }

                            let instance = client.readInstanceFile(rustplus.guildId);
                            instance.storageMonitors[entityId].type = 'toolcupboard';

                            if (info.entityInfo.payload.protectionExpiry === 0 &&
                                instance.storageMonitors[entityId].decaying === false) {
                                instance.storageMonitors[entityId].decaying = true;

                                await DiscordTools.sendDecayingNotification(rustplus.guildId, entityId);

                                if (instance.storageMonitors[entityId].inGame) {
                                    rustplus.sendTeamMessageAsync(
                                        `${instance.storageMonitors[entityId].name} is decaying!`);
                                }
                            }
                            else if (info.entityInfo.payload.protectionExpiry !== 0) {
                                instance.storageMonitors[entityId].decaying = false;
                            }
                            client.writeInstanceFile(rustplus.guildId, instance);

                            await DiscordTools.sendStorageMonitorMessage(
                                rustplus.guildId, entityId, true, false, false);

                        }, 2000);
                    }
                    else {
                        rustplus.storageMonitors[entityId] = {
                            items: message.broadcast.entityChanged.payload.items,
                            expiry: message.broadcast.entityChanged.payload.protectionExpiry,
                            capacity: message.broadcast.entityChanged.payload.capacity,
                            hasProtection: message.broadcast.entityChanged.payload.hasProtection
                        }

                        await DiscordTools.sendStorageMonitorMessage(rustplus.guildId, entityId, true, false, false);
                    }
                }
            }
        }
    },
};