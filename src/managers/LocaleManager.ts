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

import * as formatjs from '@formatjs/intl';
import * as fs from 'fs';
import * as path from 'path';

import { log } from '../../index';

export interface Locales {
    [locale: string]: LocaleData;
}

export interface LocaleData {
    [key: string]: string;
}

export class LocaleManager {
    private defaultLanguage: string;
    private locales: Locales;
    private intl: { [locale: string]: formatjs.IntlShape<string> };

    constructor(defaultLanguage: string = 'en') {
        const funcName = '[LocaleManager Init]';
        log.info(`${funcName} Default language: ${defaultLanguage}.`);
        this.defaultLanguage = defaultLanguage;
        this.locales = {};
        this.intl = {};

        /* Check if defaultLanguage exist */
        const defaultLanguagePath = path.join(__dirname, '..', 'languages', `${defaultLanguage}.json`);
        if (!fs.existsSync(defaultLanguagePath)) {
            throw new Error(`${funcName} Language file for '${defaultLanguage}' does not exist.`);
        }

        this.setup();
    }

    private setup() {
        const languageFilesPath = path.join(__dirname, '..', 'languages');
        const fileList = fs.readdirSync(languageFilesPath);

        /* Store all language file phrases in locales. */
        for (const file of fileList) {
            const language = file.replace('.json', '');
            const languageFilePath = path.join(__dirname, '..', 'languages', file);
            const languageFileText = fs.readFileSync(languageFilePath, 'utf8');
            this.locales[language] = JSON.parse(languageFileText);
        }

        /* Create intl for each language. */
        for (const file of fileList) {
            const language = file.replace('.json', '');
            const cache = formatjs.createIntlCache();
            this.intl[language] = formatjs.createIntl({
                locale: language,
                defaultLocale: this.defaultLanguage,
                messages: this.locales[language]
            }, cache);
        }
    }

    public getIntl(locale: string | null, phraseKey: string, parameters: { [key: string]: string } = {}): string {
        const funcName = '[getIntl]';
        if (locale === null) {
            locale = this.defaultLanguage;
        }
        if (!this.locales[locale]) {
            throw new Error(`${funcName} Unsupported locale: ${locale}.`);
        }
        return this.intl[locale].formatMessage({
            id: phraseKey,
            defaultMessage: this.locales[this.defaultLanguage][phraseKey]
        }, parameters);
    }
}