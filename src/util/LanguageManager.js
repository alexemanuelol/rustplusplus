/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const FormatJS = require('@formatjs/intl');
const Fs = require('fs');
const Path = require('path');

class LanguageManager {
    constructor() {
        this.cache = new Map();
        this.lastAccessed = new Map();
        this.maxCacheSize = 3; // Only keep 3 languages in memory at once
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Always keep English in memory as fallback
        this.loadLanguage('en');
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.cacheTimeout);
    }

    loadLanguage(language) {
        if (this.cache.has(language)) {
            this.lastAccessed.set(language, Date.now());
            return this.cache.get(language);
        }

        try {
            const path = Path.join(__dirname, '..', 'languages', `${language}.json`);
            const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
            const cache = FormatJS.createIntlCache();
            const intl = FormatJS.createIntl({
                locale: language,
                defaultLocale: 'en',
                messages: messages
            }, cache);

            // If cache is full, remove least recently used (except English)
            if (this.cache.size >= this.maxCacheSize && !this.cache.has(language)) {
                this.evictLeastRecentlyUsed();
            }

            this.cache.set(language, { intl, messages });
            this.lastAccessed.set(language, Date.now());
            
            return this.cache.get(language);
        } catch (error) {
            console.error(`Failed to load language ${language}:`, error);
            // Fallback to English
            return this.cache.get('en') || null;
        }
    }

    getIntl(language) {
        const langData = this.loadLanguage(language);
        return langData ? langData.intl : null;
    }

    getMessages(language) {
        const langData = this.loadLanguage(language);
        return langData ? langData.messages : null;
    }

    evictLeastRecentlyUsed() {
        let oldestTime = Date.now();
        let oldestLang = null;

        for (const [lang, time] of this.lastAccessed.entries()) {
            // Never evict English
            if (lang === 'en') continue;
            
            if (time < oldestTime) {
                oldestTime = time;
                oldestLang = lang;
            }
        }

        if (oldestLang) {
            this.cache.delete(oldestLang);
            this.lastAccessed.delete(oldestLang);
        }
    }

    cleanup() {
        const now = Date.now();
        const toRemove = [];

        for (const [lang, time] of this.lastAccessed.entries()) {
            // Never cleanup English
            if (lang === 'en') continue;
            
            if (now - time > this.cacheTimeout) {
                toRemove.push(lang);
            }
        }

        for (const lang of toRemove) {
            this.cache.delete(lang);
            this.lastAccessed.delete(lang);
        }
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            languages: Array.from(this.cache.keys()),
            maxSize: this.maxCacheSize
        };
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
        this.lastAccessed.clear();
    }
}

// Singleton instance
const languageManager = new LanguageManager();

module.exports = languageManager;