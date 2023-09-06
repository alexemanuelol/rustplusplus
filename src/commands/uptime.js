/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const DiscordMessages = require('../discordTools/discordMessages.js');
const Timer = require('../util/timer.js');

module.exports = {
	name: 'uptime',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('uptime')
			.setDescription(client.intlGet(guildId, 'commandsUptimeDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('bot')
				.setDescription(client.intlGet(guildId, 'commandsUptimeBotDesc')))
			.addSubcommand(subcommand => subcommand
				.setName('server')
				.setDescription(client.intlGet(guildId, 'commandsUptimeServerDesc')));
	},

	async execute(client, interaction) {
		const rustplus = client.rustplusInstances[interaction.guildId];

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		let string = '';
		switch (interaction.options.getSubcommand()) {
			case 'bot': {
				if (client.uptimeBot === null) {
					string = client.intlGet(interaction.guildId, 'offline');
				}
				else {
					const seconds = (new Date() - client.uptimeBot) / 1000;
					string = Timer.secondsToFullScale(seconds);
				}
			} break;

			case 'server': {
				if (!rustplus || (rustplus && rustplus.uptimeServer === null)) {
					string = client.intlGet(interaction.guildId, 'offline');
					break;
				}

				const seconds = (new Date() - rustplus.uptimeServer) / 1000;
				string = Timer.secondsToFullScale(seconds);
			} break;

			default: {
			} break;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()}`
		}));

		await DiscordMessages.sendUptimeMessage(interaction, string);
		client.log(client.intlGet(null, 'infoCap'), client.intlGet(interaction.guildId, 'commandsUptimeDesc'));
	},
};
