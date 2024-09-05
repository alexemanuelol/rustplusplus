/*const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'restart',

	getData(client, guildId) {
		return new SlashCommandBuilder()
			.setName('restart')
			.setDescription('Перезапускает процесс Node.js');
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const str = client.intlGet(guildId, 'restartingProcess');
		await client.interactionEditReply(interaction, {
			embeds: [client.discordEmbeds.getActionInfoEmbed(0, str)]
		});
	//	client.log(client.intlGet(null, 'infoCap'), str);
	//	rustplus.log(client.intlGet(null, 'infoCap'), str);

		// Завершение процесса Node.js
		process.exit(0);
	},
};
*/
/*
	Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol) and FaiThiX

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

module.exports = {
	name: 'restart',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('restart')
			.setDescription(client.intlGet(guildId, 'restartingProcess'));
	},

	async execute(client, interaction) {
		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;

		await DiscordMessages.sendInfoMessage(interaction);
		//	client.log(client.intlGet(null, 'infoCap'), str);
	//	rustplus.log(client.intlGet(null, 'infoCap'), str);

		// Завершение процесса Node.js
		process.exit(0);
	},
};
