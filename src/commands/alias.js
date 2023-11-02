/*
	Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
	name: 'alias',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('alias')
			.setDescription(client.intlGet(guildId, 'commandsAliasDesc'))
			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription(client.intlGet(guildId, 'commandsAliasAddDesc'))
				.addStringOption(option => option
					.setName('alias')
					.setDescription(client.intlGet(guildId, 'commandsAliasAddAliasDesc'))
					.setRequired(true))
				.addStringOption(option => option
					.setName('value')
					.setDescription(client.intlGet(guildId, 'commandsAliasAddValueDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription(client.intlGet(guildId, 'commandsAliasRemoveDesc'))
				.addIntegerOption(option => option
					.setName('index')
					.setDescription(client.intlGet(guildId, 'commandsAliasRemoveIndexDesc'))
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('show')
				.setDescription(client.intlGet(guildId, 'commandsAliasShowDesc')))
	},

	async execute(client, interaction) {
		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'add': {
				await addAlias(client, interaction);
			} break;

			case 'remove': {
				await removeAlias(client, interaction);
			} break;

			case 'show': {
				await showAlias(client, interaction);
			} break;

			default: {
			} break;
		}

		client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
			id: `${verifyId}`,
			value: `${interaction.options.getSubcommand()} ${interaction.options.getString('alias')} ` +
				`${interaction.options.getString('value')} ${interaction.options.getInteger('index')}`
		}));
	},
};

async function addAlias(client, interaction) {
	const guildId = interaction.guildId;
	const instance = client.getInstance(guildId);

	const aliasParameter = interaction.options.getString('alias');
	const valueParameter = interaction.options.getString('value');

	for (const alias of instance.aliases) {
		if (alias.alias === aliasParameter) {
			const str = client.intlGet(guildId, 'aliasAlreadyExist');
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log(client.intlGet(guildId, 'warningCap'), str);
			return;
		}
	}

	let index = 0;
	while (true) {
		if (!instance.aliases.some(e => e.index === index)) break;
		index += 1;
	}

	instance.aliases.push({ index: index, alias: aliasParameter, value: valueParameter });
	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'aliasWasAdded');
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(guildId, 'infoCap'), str);
	return;
}

async function removeAlias(client, interaction) {
	const guildId = interaction.guildId;
	const instance = client.getInstance(guildId);

	const indexParameter = interaction.options.getInteger('index');

	if (!instance.aliases.some(e => e.index === indexParameter)) {
		const str = client.intlGet(guildId, 'aliasIndexCouldNotBeFound');
		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
		client.log(client.intlGet(guildId, 'warningCap'), str);
		return;
	}

	instance.aliases = instance.aliases.filter(e => e.index !== indexParameter);
	client.setInstance(guildId, instance);

	const str = client.intlGet(guildId, 'aliasWasRemoved');
	await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
	client.log(client.intlGet(guildId, 'infoCap'), str);
	return;
}

async function showAlias(client, interaction) {
	const guildId = interaction.guildId;
	const instance = client.getInstance(guildId);

	const title = client.intlGet(guildId, 'aliases');
	const indexFieldName = client.intlGet(guildId, 'index');
	const aliasFieldName = client.intlGet(guildId, 'alias');
	const valueFieldName = client.intlGet(guildId, 'value');

	let totalCharacters = title.length + indexFieldName.length + aliasFieldName.length + valueFieldName.length;
	let fieldIndex = 0;
	let indexStrings = [''], aliasStrings = [''], valueStrings = [''];
	let indexStringsCharacters = 0, aliasStringsCharacters = 0, valueStringsCharacters = 0;
	for (const alias of instance.aliases) {
		const indexString = `${alias.index}\n`;
		const aliasString = `${alias.alias}\n`;
		const valueString = `${alias.value}\n`;

		if (totalCharacters + (indexString.length + aliasString.length + valueString.length) >=
			Constants.EMBED_MAX_TOTAL_CHARACTERS) {
			break;
		}

		if ((indexStringsCharacters + indexString.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
			(aliasStringsCharacters + aliasString.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
			(valueStringsCharacters + valueString.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
			fieldIndex += 1;

			indexStrings.push('');
			aliasStrings.push('');
			valueStrings.push('');

			indexStringsCharacters = 0;
			aliasStringsCharacters = 0;
			valueStringsCharacters = 0;
		}

		indexStringsCharacters += indexString.length;
		aliasStringsCharacters += aliasString.length;
		valueStringsCharacters += valueString.length;

		totalCharacters += indexString.length + aliasString.length + valueString.length;

		indexStrings[fieldIndex] += indexString;
		aliasStrings[fieldIndex] += aliasString;
		valueStrings[fieldIndex] += valueString;
	}

	const fields = [];
	for (let i = 0; i < (fieldIndex + 1); i++) {
		fields.push({
			name: i === 0 ? indexFieldName : '\u200B',
			value: indexStrings[i] !== '' ? indexStrings[i] : client.intlGet(guildId, 'empty'),
			inline: true
		});
		fields.push({
			name: i === 0 ? aliasFieldName : '\u200B',
			value: aliasStrings[i] !== '' ? aliasStrings[i] : client.intlGet(guildId, 'empty'),
			inline: true
		});
		fields.push({
			name: i === 0 ? valueFieldName : '\u200B',
			value: valueStrings[i] !== '' ? valueStrings[i] : client.intlGet(guildId, 'empty'),
			inline: true
		});
	}

	const embed = DiscordEmbeds.getEmbed({
		title: title,
		color: Constants.COLOR_DEFAULT,
		fields: fields,
		timestamp: true
	});

	await client.interactionEditReply(interaction, { embeds: [embed] });
	client.log(client.intlGet(null, 'infoCap'), client.intlGet(guildId, 'commandsAliasShowDesc'));
}