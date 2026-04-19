/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const { memoryMonitor } = require('./MemoryMonitor');

class InstanceCleanupManager {
    constructor() {
        this.lastActivityTimes = new Map(); // Track last activity for each guild
        this.cleanupInterval = null;
        this.inactivityThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.cleanupIntervalMs = 5 * 60 * 1000; // Check every 5 minutes
        this.isRunning = false;
    }

    /**
     * Start the cleanup manager
     * @param {Object} client - The Discord client instance
     */
    start(client) {
        if (this.isRunning) return;
        
        this.client = client;
        this.isRunning = true;
        
        // Initialize activity times for existing instances
        this.initializeActivityTimes();
        
        // Start periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.cleanupIntervalMs);
        
        // Perform memory-based cleanup every 10 minutes
        this.memoryCleanupInterval = setInterval(() => {
            this.performMemoryBasedCleanup();
        }, 10 * 60 * 1000);
        
        console.log('InstanceCleanupManager started');
    }

    /**
     * Stop the cleanup manager
     */
    stop() {
        if (!this.isRunning) return;
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        if (this.memoryCleanupInterval) {
            clearInterval(this.memoryCleanupInterval);
            this.memoryCleanupInterval = null;
        }
        
        this.isRunning = false;
        console.log('InstanceCleanupManager stopped');
    }

    /**
     * Initialize activity times for existing instances
     */
    initializeActivityTimes() {
        const now = Date.now();
        
        // Mark all active instances as recently active
        for (const guildId in this.client.activeRustplusInstances) {
            if (this.client.activeRustplusInstances[guildId]) {
                this.lastActivityTimes.set(guildId, now);
            }
        }
    }

    /**
     * Update activity time for a guild
     * @param {string} guildId - The guild ID
     */
    updateActivity(guildId) {
        this.lastActivityTimes.set(guildId, Date.now());
    }

    /**
     * Perform cleanup of inactive instances
     */
    performCleanup() {
        if (!this.client) return;
        
        const now = Date.now();
        const inactiveGuilds = [];
        
        // Check for inactive instances
        for (const [guildId, lastActivity] of this.lastActivityTimes.entries()) {
            const timeSinceActivity = now - lastActivity;
            
            if (timeSinceActivity > this.inactivityThreshold) {
                // Check if instance is still active but hasn't been used
                if (this.client.activeRustplusInstances[guildId] && 
                    this.client.rustplusInstances[guildId]) {
                    inactiveGuilds.push(guildId);
                }
            }
        }
        
        // Clean up inactive instances
        for (const guildId of inactiveGuilds) {
            this.cleanupInstance(guildId);
        }
        
        // Log cleanup statistics
        if (inactiveGuilds.length > 0) {
            console.log(`InstanceCleanupManager: Cleaned up ${inactiveGuilds.length} inactive instances`);
        }
    }

    /**
     * Clean up a specific instance and its associated data
     * @param {string} guildId - The guild ID to clean up
     */
    cleanupInstance(guildId) {
        try {
            const rustplus = this.client.rustplusInstances[guildId];
            
            if (rustplus) {
                // Clear all intervals and timeouts
                this.clearInstanceIntervals(rustplus);
                
                // Clear large data structures
                this.clearInstanceData(rustplus);
                
                // Disconnect and mark as deleted
                rustplus.isDeleted = true;
                rustplus.disconnect();
                
                // Remove from client collections
                delete this.client.rustplusInstances[guildId];
                this.client.activeRustplusInstances[guildId] = false;
                
                // Clean up related timers and connections
                this.client.resetRustplusVariables(guildId);
                
                // Remove from activity tracking
                this.lastActivityTimes.delete(guildId);
                
                console.log(`Cleaned up inactive RustPlus instance for guild: ${guildId}`);
            }
        } catch (error) {
            console.error(`Error cleaning up instance for guild ${guildId}:`, error);
        }
    }

    /**
     * Clear all intervals and timeouts for an instance
     * @param {Object} rustplus - The RustPlus instance
     */
    clearInstanceIntervals(rustplus) {
        // Clear main polling interval
        if (rustplus.pollingTaskId) {
            clearInterval(rustplus.pollingTaskId);
            rustplus.pollingTaskId = 0;
        }
        
        // Clear token replenish interval
        if (rustplus.tokensReplenishTaskId) {
            clearInterval(rustplus.tokensReplenishTaskId);
            rustplus.tokensReplenishTaskId = 0;
        }
        
        // Clear smart switch timeouts
        for (const timeoutId of Object.values(rustplus.currentSwitchTimeouts)) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
        rustplus.currentSwitchTimeouts = {};
        
        // Clear in-game chat timeout
        if (rustplus.inGameChatTimeout) {
            clearTimeout(rustplus.inGameChatTimeout);
            rustplus.inGameChatTimeout = null;
        }
    }

    /**
     * Clear large data structures from an instance
     * @param {Object} rustplus - The RustPlus instance
     */
    clearInstanceData(rustplus) {
        // Clear arrays and objects that can grow large
        rustplus.allConnections = [];
        rustplus.allDeaths = [];
        rustplus.playerConnections = {};
        rustplus.playerDeaths = {};
        rustplus.messagesSentByBot = [];
        rustplus.inGameChatQueue = [];
        
        // Clear event arrays
        rustplus.events = {
            all: [],
            cargo: [],
            heli: [],
            small: [],
            large: [],
            chinook: []
        };
        
        // Clear subscription items
        rustplus.foundSubscriptionItems = { all: [], buy: [], sell: [] };
        rustplus.firstPollItems = { all: [], buy: [], sell: [] };
        
        // Clear tracers
        rustplus.patrolHelicopterTracers = {};
        rustplus.cargoShipTracers = {};
        
        // Clear timers and markers
        rustplus.timers = {};
        rustplus.markers = {};
        rustplus.storageMonitors = {};
        
        // Clear interaction switches
        rustplus.interactionSwitches = [];
        
        // Clear map-related data
        if (rustplus.map) {
            rustplus.map = null;
        }
        if (rustplus.mapMarkers) {
            rustplus.mapMarkers = null;
        }
    }

    /**
     * Force cleanup of a specific guild (for manual cleanup)
     * @param {string} guildId - The guild ID to clean up
     */
    forceCleanup(guildId) {
        this.cleanupInstance(guildId);
    }

    /**
     * Perform memory-based cleanup when memory usage is high
     */
    performMemoryBasedCleanup() {
        const memStats = memoryMonitor.getCurrentStats();
        
        // If heap utilization is above 70%, perform aggressive cleanup
        if (memStats.heapUtilization > 70) {
            console.log(`High memory usage detected (${memStats.heapUtilization.toFixed(1)}%), performing aggressive cleanup`);
            
            // Reduce inactivity threshold for aggressive cleanup
            const originalThreshold = this.inactivityThreshold;
            this.inactivityThreshold = 10 * 60 * 1000; // 10 minutes instead of 30
            
            this.performCleanup();
            
            // Restore original threshold
            this.inactivityThreshold = originalThreshold;
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                console.log('Triggered garbage collection after aggressive cleanup');
            }
        }
    }

    /**
     * Get cleanup statistics
     * @returns {Object} Statistics about tracked instances
     */
    getStatistics() {
        const now = Date.now();
        const stats = {
            totalTracked: this.lastActivityTimes.size,
            activeInstances: 0,
            inactiveInstances: 0,
            oldestActivity: null,
            newestActivity: null
        };
        
        let oldestTime = now;
        let newestTime = 0;
        
        for (const [guildId, lastActivity] of this.lastActivityTimes.entries()) {
            const timeSinceActivity = now - lastActivity;
            
            if (timeSinceActivity > this.inactivityThreshold) {
                stats.inactiveInstances++;
            } else {
                stats.activeInstances++;
            }
            
            if (lastActivity < oldestTime) {
                oldestTime = lastActivity;
            }
            if (lastActivity > newestTime) {
                newestTime = lastActivity;
            }
        }
        
        stats.oldestActivity = oldestTime < now ? new Date(oldestTime) : null;
        stats.newestActivity = newestTime > 0 ? new Date(newestTime) : null;
        
        return stats;
    }
}

module.exports = InstanceCleanupManager;