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

import * as discordjs from 'discord.js';

export function getTextInput(options: discordjs.TextInputComponentData): discordjs.TextInputBuilder {
    const textInput = new discordjs.TextInputBuilder();

    options.type = discordjs.ComponentType.TextInput;

    if (options.hasOwnProperty('customId') && options.customId !== undefined) {
        textInput.setCustomId(options.customId);
    }

    if (options.hasOwnProperty('label') && options.label !== undefined) {
        textInput.setLabel(options.label.slice(0, 45));
    }

    if (options.hasOwnProperty('value') && options.value !== undefined) {
        textInput.setValue(options.value);
    }

    if (options.hasOwnProperty('style') && options.style !== undefined) {
        textInput.setStyle(options.style);
    }

    if (options.hasOwnProperty('minLength') && options.minLength !== undefined) {
        textInput.setMinLength(options.minLength);
    }

    if (options.hasOwnProperty('maxLength') && options.maxLength !== undefined) {
        textInput.setMaxLength(options.maxLength);
    }

    if (options.hasOwnProperty('placeholder') && options.placeholder !== undefined) {
        textInput.setPlaceholder(options.placeholder);
    }

    if (options.hasOwnProperty('required') && options.required !== undefined) {
        textInput.setRequired(options.required);
    }

    return textInput;
}