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
                        let content = {};
                        content.embeds = [
                            new MessageEmbed()
                                .setColor('#ce412b')
                                .setThumbnail(`attachment://${instance.alarms[id].image}`)
                                .setTitle(instance.alarms[id].name)
                                .addFields(
                                    { name: 'ID', value: `\`${id}\``, inline: true },
                                    { name: 'Message', value: `\`${instance.alarms[id].message}\``, inline: true }
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
                    }

                    DiscordTools.sendSmartAlarmMessage(rustplus.guildId, id, true, false, false);
                }
            }
        }
    },
};