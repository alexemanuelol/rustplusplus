/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';

import { log } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { slashCommandHandler } from '../handlers/slashCommandHandler';
import { autocompleteHandler } from '../handlers/autocompleteHandler';

export const name = 'interactionCreate';
export const once = false;

export async function execute(dm: DiscordManager, interaction: discordjs.Interaction) {
    const funcName = `[discordEvent: ${name}]`;
    const logParam = { guildId: interaction.guildId };

    let result = false;

    dm.logInteraction(interaction, 'Initiated');

    // TODO! Each interaction handler needs to check if initiator of the interaction is valid
    // i.e. if roles are set then not everyone can use commands etc

    /* Slash Commands. */
    if (interaction.isChatInputCommand()) {
        result = await slashCommandHandler(dm, interaction);
    }
    /* Autocomplete Interactions. */
    else if (interaction.isAutocomplete()) {
        result = await autocompleteHandler(dm, interaction);
    }
    /* Context Menu Commands (User & Message). */
    else if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
        /* TBD */
    }
    /* Button Interaction. */
    else if (interaction.isButton()) {
        /* TBD */
    }
    /* Select Menus (All types). */
    else if (interaction.isAnySelectMenu()) {
        /* TBD */
    }
    /* Modal Submissions. */
    else if (interaction.isModalSubmit()) {
        /* TBD */
    }
    /* Unknown interaction. */
    else {
        log.error(`${funcName} Unknown interaction.`, logParam);
    }

    if (result) {
        dm.logInteraction(interaction, 'Completed')
    }
}