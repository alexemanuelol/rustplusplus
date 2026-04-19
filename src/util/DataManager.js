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

const Fs = require('fs');
const Path = require('path');

class DataManager {
    constructor() {
        this.cache = new Map();
        this.lastAccessed = new Map();
        this.maxCacheSize = 5; // Only keep 5 data files in memory at once
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        // Define available data files
        this.dataFiles = {
            'buildingBlocks': '../staticFiles/rustlabsBuildingBlocks.json',
            'other': '../staticFiles/rustlabsOther.json',
            'craft': '../staticFiles/rustlabsCraftData.json',
            'research': '../staticFiles/rustlabsResearchData.json',
            'recycle': '../staticFiles/rustlabsRecycleData.json',
            'durability': '../staticFiles/rustlabsDurabilityData.json',
            'smelting': '../staticFiles/rustlabsSmeltingData.json',
            'despawn': '../staticFiles/rustlabsDespawnData.json',
            'stack': '../staticFiles/rustlabsStackData.json',
            'decay': '../staticFiles/rustlabsDecayData.json',
            'upkeep': '../staticFiles/rustlabsUpkeepData.json'
        };
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.cacheTimeout);
    }

    loadData(dataType) {
        if (this.cache.has(dataType)) {
            this.lastAccessed.set(dataType, Date.now());
            return this.cache.get(dataType);
        }

        const filePath = this.dataFiles[dataType];
        if (!filePath) {
            console.error(`Unknown data type: ${dataType}`);
            return null;
        }

        try {
            const fullPath = Path.join(__dirname, filePath);
            const data = JSON.parse(Fs.readFileSync(fullPath, 'utf8'));

            // If cache is full, remove least recently used
            if (this.cache.size >= this.maxCacheSize && !this.cache.has(dataType)) {
                this.evictLeastRecentlyUsed();
            }

            this.cache.set(dataType, data);
            this.lastAccessed.set(dataType, Date.now());
            
            return data;
        } catch (error) {
            console.error(`Failed to load data ${dataType}:`, error);
            return null;
        }
    }

    // Streaming method for large datasets - returns iterator
    *streamData(dataType, chunkSize = 100) {
        const data = this.loadData(dataType);
        if (!data) return;

        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i += chunkSize) {
                yield data.slice(i, i + chunkSize);
            }
        } else if (typeof data === 'object') {
            const entries = Object.entries(data);
            for (let i = 0; i < entries.length; i += chunkSize) {
                const chunk = {};
                for (let j = i; j < Math.min(i + chunkSize, entries.length); j++) {
                    const [key, value] = entries[j];
                    chunk[key] = value;
                }
                yield chunk;
            }
        }
    }

    // Get specific item from data without loading entire dataset
    getItem(dataType, itemId) {
        const data = this.loadData(dataType);
        return data ? data[itemId] : null;
    }

    // Search for items matching criteria without loading entire dataset
    findItems(dataType, predicate, limit = 10) {
        const results = [];
        let count = 0;
        
        for (const chunk of this.streamData(dataType, 50)) {
            if (Array.isArray(chunk)) {
                for (const item of chunk) {
                    if (predicate(item)) {
                        results.push(item);
                        count++;
                        if (count >= limit) return results;
                    }
                }
            } else {
                for (const [key, value] of Object.entries(chunk)) {
                    if (predicate(value, key)) {
                        results.push({ id: key, ...value });
                        count++;
                        if (count >= limit) return results;
                    }
                }
            }
        }
        
        return results;
    }

    evictLeastRecentlyUsed() {
        let oldestTime = Date.now();
        let oldestType = null;

        for (const [type, time] of this.lastAccessed.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestType = type;
            }
        }

        if (oldestType) {
            this.cache.delete(oldestType);
            this.lastAccessed.delete(oldestType);
        }
    }

    cleanup() {
        const now = Date.now();
        const toRemove = [];

        for (const [type, time] of this.lastAccessed.entries()) {
            if (now - time > this.cacheTimeout) {
                toRemove.push(type);
            }
        }

        for (const type of toRemove) {
            this.cache.delete(type);
            this.lastAccessed.delete(type);
        }
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            types: Array.from(this.cache.keys()),
            maxSize: this.maxCacheSize,
            memoryUsage: this.getApproximateMemoryUsage()
        };
    }

    getApproximateMemoryUsage() {
        let totalSize = 0;
        for (const data of this.cache.values()) {
            totalSize += JSON.stringify(data).length;
        }
        return `${Math.round(totalSize / 1024)} KB`;
    }

    // Preload frequently used data
    preloadEssentialData() {
        // Load most commonly used data types
        this.loadData('craft');
        this.loadData('stack');
        this.loadData('recycle');
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
const dataManager = new DataManager();

module.exports = dataManager;