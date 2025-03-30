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

import { guildInstanceManager as gim, localeManager as lm } from '../../index';
import { GuildInstance } from '../managers/guildInstanceManager';
import * as types from '../utils/types';
import { getTextInput } from './discordTextInputs';

export const ModalLimits = {
    CustomId: 100,
    Title: 45,
    MaxComponents: 5
};

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}


/**
 * Modal help functions
 */

export function getModal(options: discordjs.ModalComponentData): discordjs.ModalBuilder {
    const funcName = `[getModal]`;
    const modal = new discordjs.ModalBuilder();

    if ('customId' in options && options.customId) {
        if (options.customId.length > ModalLimits.CustomId) {
            throw new Error(`${funcName} CustomId exceeds limit ${ModalLimits.CustomId}, actual: ` +
                `${options.customId.length}. CustomId: '${options.customId}'`);
        }
        modal.setCustomId(options.customId);
    }

    if ('title' in options && options.title) {
        modal.setTitle(truncate(options.title, ModalLimits.Title));
    }

    if ('components' in options && Array.isArray(options.components) && options.components.length > 0) {
        const truncatedComponents = options.components.slice(0, ModalLimits.MaxComponents);
        modal.addComponents(...truncatedComponents as discordjs.ActionRowBuilder<discordjs.TextInputBuilder>[]);
    }

    return modal;
}


/**
 * Guild based modals
 */


/**
 * Settings based modals
 */

export function getSettingInGameChatTrademarkModal(guildId: types.GuildId): discordjs.ModalBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    return getModal({
        customId: 'GeneralSetting-inGameChatTrademark',
        title: lm.getIntl(language, 'trademarkEdit'),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'inGameChatTrademark',
                style: discordjs.TextInputStyle.Short,
                label: lm.getIntl(language, 'trademark'),
                minLength: 1,
                maxLength: 16,
                required: false,
                value: gInstance.generalSettings.inGameChatTrademark,
                placeholder: lm.getIntl(language, 'trademark'),
                type: discordjs.ComponentType.TextInput
            }))
        ]
    });
}

export function getSettingInGameChatCommandPrefixModal(guildId: types.GuildId): discordjs.ModalBuilder {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    return getModal({
        customId: 'GeneralSetting-inGameChatCommandPrefix',
        title: lm.getIntl(language, 'commandPrefixEdit'),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'inGameChatCommandPrefix',
                style: discordjs.TextInputStyle.Short,
                label: lm.getIntl(language, 'commandPrefix'),
                minLength: 1,
                maxLength: 3,
                required: true,
                value: gInstance.generalSettings.inGameChatCommandPrefix,
                placeholder: lm.getIntl(language, 'commandPrefix'),
                type: discordjs.ComponentType.TextInput
            }))
        ]
    });
}