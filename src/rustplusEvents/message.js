const CommandHandler = require('../handlers/inGameCommandHandler.js');
const TeamChatHandler = require("../handlers/teamChatHandler.js");
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageAttachment } = require('discord.js');
const TeamHandler = require('../handlers/teamHandler.js');

module.exports = {
    name: 'message',
    async execute(rustplus, client, message) {
        if (rustplus.debug) {
            rustplus.log('MESSAGE', `MESSAGE RECEIVED:\n${JSON.stringify(message)}`);
        }

        if (message.hasOwnProperty('response')) {

        }
        else if (message.hasOwnProperty('broadcast')) {
            if (message.broadcast.hasOwnProperty('teamChanged')) {
                TeamHandler.handler(rustplus, client, message.broadcast.teamChanged.teamInfo);
                rustplus.team.updateTeam(message.broadcast.teamChanged.teamInfo);
            }
            else if (message.broadcast.hasOwnProperty('teamMessage')) {
                /* Let command handler handle the potential command */
                let handled = CommandHandler.inGameCommandHandler(rustplus, client, message);

                if (!handled) {
                    TeamChatHandler(rustplus, client, message.broadcast.teamMessage.message);
                }
            }
            else if (message.broadcast.hasOwnProperty('entityChanged')) {
                let id = message.broadcast.entityChanged.entityId;
                let instance = client.readInstanceFile(rustplus.guildId);

                if (!instance.switches.hasOwnProperty(id)) {
                    return;
                }

                if (rustplus.interactionSwitches.hasOwnProperty(id)) {
                    delete rustplus.interactionSwitches[id];
                }
                else {
                    let sw = instance.switches[id];

                    let active = message.broadcast.entityChanged.payload.value;
                    let prefix = rustplus.generalSettings.prefix;
                    instance.switches[id].active = active;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let file = new MessageAttachment(`src/images/electrics/${instance.switches[id].image}`);
                    let embed = DiscordTools.getSwitchButtonsEmbed(id, instance.switches[id], prefix);
                    let row = DiscordTools.getSwitchButtonsRow(id, active);

                    await client.switchesMessages[rustplus.guildId][id].edit({
                        embeds: [embed], components: [row], files: [file]
                    });
                }
            }
        }
    },
};