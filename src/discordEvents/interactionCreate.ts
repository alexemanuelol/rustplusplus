/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import { Interaction, InteractionType } from 'discord.js';

import { log, client, localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as discordEmbeds from '../discordTools/discord-embeds';
import * as discordTools from '../discordTools/discord-tools';
import { selectMenuHandler } from '../handlers/select-menu-handler';
import { modalHandler } from '../handlers/modal-handler';
import { buttonHandler } from '../handlers/button-handler';
const Config = require('../../config');


export const name = 'interactionCreate';

export async function execute(interaction: Interaction) {
    const instance = guildInstance.readGuildInstanceFile(interaction.guildId as string);
    const language = instance.generalSettings.language;

    /* Check so that the interaction comes from valid channels */
    if (!Object.values(instance.channelIds).includes(interaction.channelId) && !interaction.isCommand) {
        log.warn(lm.getIntl(Config.general.language, 'interactionInvalidChannel'))
        if (interaction.isButton()) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                log.error(lm.getIntl(Config.general.language, 'couldNotDeferInteraction'));
            }
        }
    }

    if (interaction.isButton()) {
        await buttonHandler(interaction);
    }
    else if (interaction.isStringSelectMenu()) {
        await selectMenuHandler(interaction);
    }
    else if (interaction.type === InteractionType.ApplicationCommand) {
        const command = client.commands.get(interaction.commandName);

        /* If the command doesn't exist, return */
        if (!command) return;

        try {
            await command.execute(client, interaction);
        }
        catch (e) {
            log.error(e);

            const str = lm.getIntl(language, 'errorExecutingCommand');
            await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str));
            log.error(str);
        }
    }
    else if (interaction.type === InteractionType.ModalSubmit) {
        await modalHandler(interaction);
    }
    else {
        log.error(lm.getIntl(Config.general.language, 'unknownInteraction'));
    }
}