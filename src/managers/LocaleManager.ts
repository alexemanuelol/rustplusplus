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
import * as formatjs from '@formatjs/intl';
import * as fs from 'fs';
import * as path from 'path';

import { log } from '../../index';

export type Locales = Partial<Record<Languages, LocaleData>>;

export interface LocaleData {
    [key: string]: string;
}

export enum Languages {
    CZECH = 'cs',
    GERMAN = 'de',
    ENGLISH = 'en',
    SPANISH = 'es',
    FRENCH = 'fr',
    ITALIAN = 'it',
    KOREAN = 'ko',
    POLISH = 'pl',
    PORTUGUESE = 'pt',
    RUSSIAN = 'ru',
    SWEDISH = 'sv',
    TURKISH = 'tr'
}

export const LanguageDiscordEmoji: Record<Languages, discordjs.ComponentEmojiResolvable> = {
    'cs': '🇨🇿',
    'de': '🇩🇪',
    'en': '🇬🇧',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'it': '🇮🇹',
    'ko': '🇰🇷',
    'pl': '🇵🇱',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
    'sv': '🇸🇪',
    'tr': '🇹🇷'
};

export class LocaleManager {
    private defaultLanguage: Languages;
    private locales: Locales;
    private intl: Partial<Record<Languages, formatjs.IntlShape<string>>>;

    constructor(defaultLanguage: Languages = Languages.ENGLISH) {
        const fName = '[LocaleManager: Init]';
        log.info(`${fName} Default language '${defaultLanguage}'.`);
        this.defaultLanguage = defaultLanguage;
        this.locales = {};
        this.intl = {};

        /* Check if defaultLanguage exist */
        const defaultLanguagePath = path.join(__dirname, '..', 'languages', `${defaultLanguage}.json`);
        if (!fs.existsSync(defaultLanguagePath)) {
            throw new Error(`${fName} Language file for '${defaultLanguage}' does not exist. Exiting...`);
        }

        this.setup();
    }

    private setup() {
        const fName = '[LocaleManager: setup]'
        const languageFilesPath = path.join(__dirname, '..', 'languages');
        const fileList = fs.readdirSync(languageFilesPath);

        const allLanguages = Object.values(Languages);
        const foundLanguageFiles: string[] = [];

        /* Store all language file phrases in locales. */
        for (const file of fileList) {
            const language = file.replace('.json', '') as Languages;
            if (!allLanguages.includes(language)) {
                throw new Error(`${fName} Language '${language}' is not part of supported languages. Exiting...`);
            }

            foundLanguageFiles.push(language);

            const languageFilePath = path.join(languageFilesPath, file);
            const languageFileText = fs.readFileSync(languageFilePath, 'utf8');
            this.locales[language] = JSON.parse(languageFileText);
        }

        const missingLanguages = allLanguages.filter(language => !foundLanguageFiles.includes(language));

        if (missingLanguages.length > 0) {
            throw new Error(`${fName} Missing language files for the following languages: ` +
                `${missingLanguages.join(', ')}. Exiting...`);
        }

        /* Create intl for each language. */
        for (const language of Object.keys(this.locales) as Languages[]) {
            const cache = formatjs.createIntlCache();
            this.intl[language] = formatjs.createIntl(
                {
                    locale: language,
                    defaultLocale: this.defaultLanguage,
                    messages: this.locales[language]!
                },
                cache
            );
        }
    }

    public getIntl(locale: Languages | null, phraseKey: string, parameters: Record<string, string> = {}): string {
        const fName = '[LocaleManager: getIntl]';

        locale = locale ?? this.defaultLanguage;
        if (!this.locales[locale]) {
            throw new Error(`${fName} Unsupported locale '${locale}'.`);
        }

        return this.intl[locale]!.formatMessage({
            id: phraseKey,
            defaultMessage: this.locales[this.defaultLanguage]![phraseKey] ?? phraseKey
        }, parameters);
    }
}

export function isValidLanguage(value: unknown): value is Languages {
    return typeof value === 'string' && Object.values(Languages).includes(value as Languages);
}