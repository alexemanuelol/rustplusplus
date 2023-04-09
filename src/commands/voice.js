/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 Squidysquid1

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

//Add commandsVoiceDesc to en.json
//Add voiceJoinDesc to en.json
//Add voiceLeaveDesc to en.json

const Builder = require('@discordjs/builders');
const { joinVoiceChannel,getVoiceConnection } = require('@discordjs/voice');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'voice',

    getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('voice')
			.setDescription(client.intlGet(guildId, 'commandsVoiceDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('join')
				.setDescription(client.intlGet(guildId, 'voiceJoinDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('leave')
				.setDescription(client.intlGet(guildId, 'voiceLeaveDesc')));
	},

    async execute(client, interaction) {

        const rustplus = client.rustplusInstances[interaction.guildId];

        if (!await client.validatePermissions(interaction)) return;

        switch (interaction.options.getSubcommand()) {
            case 'join':{
                if (rustplus.isInVoice) {
                    await DiscordMessages.sendVoiceMessage(interaction, 'alreadyInVoice');
                    return;
                }
                await DiscordMessages.sendVoiceMessage(interaction, 'join');
                console.log(interaction)
                client.log(client.intlGet(null, 'infoCap'), client.intlGet(interaction.guildId, 'voiceJoinDesc'));
                joinVoiceChannel({
                    channelId: interaction.member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                rustplus.isInVoice = true;

                } break;
            case 'leave':{
                if (!rustplus.isInVoice) {
                    await DiscordMessages.sendVoiceMessage(interaction, 'notInVoice');
                    return;
                }
                await DiscordMessages.sendVoiceMessage(interaction, 'leave');
                console.log(interaction)
                client.log(client.intlGet(null, 'infoCap'), client.intlGet(interaction.guildId, 'voiceLeaveDesc'));
                const connection = getVoiceConnection(interaction.guildId);
                connection.destroy();
                rustplus.isInVoice = false;
                }break;
            default:
                break;
        }
    },
};