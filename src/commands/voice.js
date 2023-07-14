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

const Builder = require('@discordjs/builders');
const {joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, VoiceConnectionStatus} = require('@discordjs/voice');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'voice',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('voice')
            .setDescription(client.intlGet(guildId, 'commandsVoiceDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('join')
				.setDescription(client.intlGet(guildId, 'commandsVcJoinDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('test')
                .setDescription(client.intlGet(guildId, 'commandsVcLeaveDesc'))
                .addStringOption(option => option
                    .setName('tts')
                    .setDescription('Text to speech')
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('leave')
                .setDescription(client.intlGet(guildId, 'commandsVcLeaveDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('settings')
                .setDescription(client.intlGet(guildId, 'commandsVcSettingsDesc'))
                .addStringOption(option => option
                    .setName('gender')
                    .setDescription(client.intlGet(guildId, 'commandsVcGenderDesc'))
                    .setRequired(true)
                    .addChoices(
                        { name: client.intlGet(guildId, 'commandsVcMale'), value: 'Male' },
                        { name: client.intlGet(guildId, 'commandsVcFemale'), value: 'Female' })))

    },

    async execute(client, interaction) {
        const instance = client.getInstance(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'join': {
                const voiceState = interaction.member.voice;
                if (voiceState && voiceState.channel) {
                    const voiceChannelId = voiceState.channel.id;
                    const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);
                    console.log(`Joining voice channel ${voiceChannel.name} with the ID ${voiceChannel.id} in guild ${interaction.guild.name}`);
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    connection.on(VoiceConnectionStatus.Ready, () => {
                        console.log('The connection has entered the Ready state - ready to play audio!');
                    });
                }
                
			} break;

            case 'leave': {
                const connection = getVoiceConnection(interaction.guild.id);
                if (connection) {
                    connection.destroy();
                }
            } break;

            case 'settings': {
            } break;

            case 'test': {
                const connection = getVoiceConnection(interaction.guild.id);
                if (connection && interaction.member.voice.channel.id == connection.joinConfig.channelId) {
                    let speak = 'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=' + encodeURIComponent(interaction.options.getString('tts'));
                    const player = createAudioPlayer();
                    connection.subscribe(player);
                    let resource = createAudioResource(speak);
                    player.play(resource);
                }
            } break;

			default: {
			} break;
		}
    },
};