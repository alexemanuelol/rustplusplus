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

import { log } from '../../index';
import * as discordEmbeds from '../discordTools/discord-embeds';
import * as discordTools from '../discordTools/discord-tools';
const { DiscordBot } = require('../structures/DiscordBot.js');

export const name = 'interactionCreate';

export async function execute(client: typeof DiscordBot, interaction: Interaction) {
    const instance = client.getInstance(interaction.guildId);

    /* Check so that the interaction comes from valid channels */
    if (!Object.values(instance.channelIds).includes(interaction.channelId) && !interaction.isCommand) {
        log.warn(client.intlGet(null, 'interactionInvalidChannel'))
        if (interaction.isButton()) {
            try {
                interaction.deferUpdate();
            }
            catch (e) {
                log.error(client.intlGet(null, 'couldNotDeferInteraction'));
            }
        }
    }

    if (interaction.isButton()) {
        require('../handlers/buttonHandler')(client, interaction); //! TODO Needs to be refactored for typescript
    }
    else if (interaction.isStringSelectMenu()) {
        require('../handlers/selectMenuHandler')(client, interaction);
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

            const str = client.intlGet(interaction.guildId, 'errorExecutingCommand');
            await discordTools.interactionEditReply(interaction, discordEmbeds.getActionInfoEmbed(1, str));
            log.error(str);
        }
    }
    else if (interaction.type === InteractionType.ModalSubmit) {
        require('../handlers/modalHandler')(client, interaction);
    }
    else {
        log.error(client.intlGet(null, 'unknownInteraction'));
    }
}