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


export const TextInputLimits = {
    CustomId: 100,
    Label: 45,
    MinLength: 0,
    MaxLength: 4000,
    Value: 4000,
    Placeholder: 100
};

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}


/**
 * textInput help functions
 */

export function getTextInput(options: discordjs.TextInputComponentData): discordjs.TextInputBuilder {
    const fName = `[getTextInput]`;
    const textInput = new discordjs.TextInputBuilder();

    if ('customId' in options && options.customId) {
        if (options.customId.length > TextInputLimits.CustomId) {
            throw new Error(`${fName} CustomId exceeds limit ${TextInputLimits.CustomId}, actual: ` +
                `${options.customId.length}. CustomId: '${options.customId}'`);
        }
        textInput.setCustomId(options.customId);
    }

    if ('style' in options && options.style) {
        textInput.setStyle(options.style);
    }

    if ('label' in options && options.label) {
        textInput.setLabel(truncate(options.label, TextInputLimits.Label));
    }

    if ('minLength' in options && options.minLength) {
        textInput.setMinLength(Math.min(options.minLength, TextInputLimits.MinLength));
    }

    if ('maxLength' in options && options.maxLength) {
        textInput.setMaxLength(Math.min(options.maxLength, TextInputLimits.MaxLength));
    }

    if ('required' in options && options.required !== undefined) {
        textInput.setRequired(options.required);
    }

    if ('value' in options && options.value) {
        textInput.setValue(truncate(options.value, TextInputLimits.Value));
    }

    if ('placeholder' in options && options.placeholder) {
        textInput.setPlaceholder(truncate(options.placeholder, TextInputLimits.Placeholder));
    }

    return textInput;
}