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
import { selectMenuHandler } from '../handlers/selectMenuHandler';
import { buttonHandler } from '../handlers/buttonHandler';
import { modalHandler } from '../handlers/modalHandler';

export const name = 'interactionCreate';
export const once = false;

export async function execute(dm: DiscordManager, interaction: discordjs.Interaction) {
    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: interaction.guildId
    };

    let result = false;

    dm.logInteraction(interaction, 'Initiated');

    /* Slash Commands */
    if (interaction.isChatInputCommand()) {
        result = await slashCommandHandler(dm, interaction);
    }
    /* Autocomplete Interactions */
    else if (interaction.isAutocomplete()) {
        result = await autocompleteHandler(dm, interaction);
    }
    /* Context Menu Commands (User & Message) */
    else if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
        /* TBD */
    }
    /* Button Interaction */
    else if (interaction.isButton()) {
        result = await buttonHandler(dm, interaction);
    }
    /* Select Menus (All types) */
    else if (interaction.isAnySelectMenu()) {
        result = await selectMenuHandler(dm, interaction);
    }
    /* Modal Submissions */
    else if (interaction.isModalSubmit()) {
        result = await modalHandler(dm, interaction);
    }
    /* Unknown interaction */
    else {
        log.error(`${fn} Unknown interaction.`, logParam);
    }

    if (result) {
        dm.logInteraction(interaction, 'Completed')
    }
}