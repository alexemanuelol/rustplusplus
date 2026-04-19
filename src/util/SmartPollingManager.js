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

const { memoryMonitor } = require('./MemoryMonitor');

/**
 * Smart Polling Manager - Optimizes polling intervals based on activity levels
 * Reduces memory churn by adjusting polling frequency dynamically
 */
class SmartPollingManager {
    constructor() {
        this.guildPollingData = new Map(); // Track polling data per guild
        this.basePollingInterval = 10000; // 10 seconds (default)
        this.minPollingInterval = 5000;   // 5 seconds (high activity)
        this.maxPollingInterval = 60000;  // 60 seconds (low activity)
        this.activityThresholds = {
            high: 2 * 60 * 1000,    // 2 minutes - recent activity
            medium: 10 * 60 * 1000, // 10 minutes - moderate activity
            low: 30 * 60 * 1000     // 30 minutes - low activity
        };
        
        // Set up memory pressure monitoring
        this.setupMemoryPressureMonitoring();
    }

    /**
     * Initialize polling for a guild
     * @param {string} guildId - Guild ID
     * @param {Object} rustplus - RustPlus instance
     * @param {Object} client - Discord client
     */
    initializePolling(guildId, rustplus, client) {
        const pollingData = {
            guildId,
            rustplus,
            client,
            currentInterval: this.basePollingInterval,
            lastActivity: Date.now(),
            activityLevel: 'medium',
            pollingTaskId: null,
            consecutiveInactivePolls: 0,
            totalPolls: 0,
            lastDataChange: Date.now()
        };

        this.guildPollingData.set(guildId, pollingData);
        this.startPolling(guildId);
    }

    /**
     * Start smart polling for a guild
     * @param {string} guildId - Guild ID
     */
    startPolling(guildId) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData) return;

        // Clear existing polling if any
        this.stopPolling(guildId);

        // Start new polling with current interval
        pollingData.pollingTaskId = setInterval(
            () => this.performSmartPoll(guildId),
            pollingData.currentInterval
        );

        console.log(`Smart polling started for guild ${guildId} with ${pollingData.currentInterval}ms interval`);
    }

    /**
     * Stop polling for a guild
     * @param {string} guildId - Guild ID
     */
    stopPolling(guildId) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData || !pollingData.pollingTaskId) return;

        clearInterval(pollingData.pollingTaskId);
        pollingData.pollingTaskId = null;
        console.log(`Smart polling stopped for guild ${guildId}`);
    }

    /**
     * Remove polling data for a guild
     * @param {string} guildId - Guild ID
     */
    removeGuild(guildId) {
        this.stopPolling(guildId);
        this.guildPollingData.delete(guildId);
    }

    /**
     * Update activity for a guild (called when user interactions occur)
     * @param {string} guildId - Guild ID
     */
    updateActivity(guildId) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData) return;

        pollingData.lastActivity = Date.now();
        pollingData.consecutiveInactivePolls = 0;
        
        // Recalculate activity level and adjust polling if needed
        this.updateActivityLevel(guildId);
    }

    /**
     * Perform a smart poll with activity-based optimizations
     * @param {string} guildId - Guild ID
     */
    async performSmartPoll(guildId) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData) return;

        const { rustplus, client } = pollingData;
        
        try {
            // Store previous data for change detection
            const prevInfo = rustplus.info ? { ...rustplus.info } : null;
            const prevTeamSize = (rustplus.team && rustplus.team.members) ? rustplus.team.members.length : 0;
            const prevMapMarkersCount = (rustplus.mapMarkers && rustplus.mapMarkers.markers) ? rustplus.mapMarkers.markers.length : 0;

            // Perform the actual polling
            const PollingHandler = require('../handlers/pollingHandler.js');
            await PollingHandler.pollingHandler(rustplus, client);

            pollingData.totalPolls++;

            // Detect if significant data changed
            let dataChanged = false;
            if (prevInfo && rustplus.info) {
                dataChanged = prevInfo.players !== rustplus.info.players ||
                             prevInfo.queuedPlayers !== rustplus.info.queuedPlayers ||
                             prevInfo.maxPlayers !== rustplus.info.maxPlayers;
            }

            if (rustplus.team && rustplus.team.members && prevTeamSize !== rustplus.team.members.length) {
                dataChanged = true;
            }

            if (rustplus.mapMarkers && rustplus.mapMarkers.markers && prevMapMarkersCount !== rustplus.mapMarkers.markers.length) {
                dataChanged = true;
            }

            if (dataChanged) {
                pollingData.lastDataChange = Date.now();
                pollingData.consecutiveInactivePolls = 0;
            } else {
                pollingData.consecutiveInactivePolls++;
            }

            // Update activity level and adjust polling interval
            this.updateActivityLevel(guildId);

        } catch (error) {
            console.error(`Smart polling error for guild ${guildId}:`, error);
            pollingData.consecutiveInactivePolls++;
        }
    }

    /**
     * Update activity level and adjust polling interval accordingly
     * @param {string} guildId - Guild ID
     */
    updateActivityLevel(guildId) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData) return;

        const now = Date.now();
        const timeSinceActivity = now - pollingData.lastActivity;
        const timeSinceDataChange = now - pollingData.lastDataChange;
        
        let newActivityLevel;
        let newInterval;

        // Determine activity level based on recent activity and data changes
        if (timeSinceActivity < this.activityThresholds.high || 
            timeSinceDataChange < this.activityThresholds.high) {
            newActivityLevel = 'high';
            newInterval = this.minPollingInterval;
        } else if (timeSinceActivity < this.activityThresholds.medium || 
                   timeSinceDataChange < this.activityThresholds.medium) {
            newActivityLevel = 'medium';
            newInterval = this.basePollingInterval;
        } else {
            newActivityLevel = 'low';
            // Gradually increase interval for inactive instances
            const inactivityMultiplier = Math.min(3, 1 + (pollingData.consecutiveInactivePolls / 10));
            newInterval = Math.min(this.maxPollingInterval, this.basePollingInterval * inactivityMultiplier);
        }

        // Only restart polling if interval changed significantly (>20% difference)
        const intervalChange = Math.abs(newInterval - pollingData.currentInterval) / pollingData.currentInterval;
        if (intervalChange > 0.2) {
            pollingData.activityLevel = newActivityLevel;
            pollingData.currentInterval = newInterval;
            
            console.log(`Adjusting polling for guild ${guildId}: ${newActivityLevel} activity, ${newInterval}ms interval`);
            this.startPolling(guildId); // Restart with new interval
        }
    }

    /**
     * Get polling statistics for all guilds
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const stats = {
            totalGuilds: this.guildPollingData.size,
            activityLevels: { high: 0, medium: 0, low: 0 },
            averageInterval: 0,
            totalPolls: 0,
            guilds: []
        };

        let totalInterval = 0;
        for (const [guildId, data] of this.guildPollingData) {
            stats.activityLevels[data.activityLevel]++;
            totalInterval += data.currentInterval;
            stats.totalPolls += data.totalPolls;
            
            stats.guilds.push({
                guildId,
                activityLevel: data.activityLevel,
                currentInterval: data.currentInterval,
                totalPolls: data.totalPolls,
                consecutiveInactivePolls: data.consecutiveInactivePolls,
                lastActivity: new Date(data.lastActivity).toISOString()
            });
        }

        if (this.guildPollingData.size > 0) {
            stats.averageInterval = Math.round(totalInterval / this.guildPollingData.size);
        }

        return stats;
    }

    /**
     * Set up memory pressure monitoring
     */
    setupMemoryPressureMonitoring() {
        // Check for memory pressure every 2 minutes
        setInterval(() => {
            const memStats = memoryMonitor.getCurrentStats();
            this.handleMemoryPressure(memStats);
        }, 2 * 60 * 1000);
    }

    /**
     * Handle memory pressure by adjusting polling
     * @param {Object} memStats - Memory statistics
     */
    handleMemoryPressure(memStats) {
        const utilization = memStats.heapUtilization;
        
        if (utilization > 85) {
            // Critical memory pressure - aggressive reduction
            this.adjustPollingForMemoryPressure('critical', 2.0);
        } else if (utilization > 75) {
            // High memory pressure - moderate reduction
            this.adjustPollingForMemoryPressure('high', 1.5);
        } else if (utilization < 50) {
            // Low memory pressure - can increase polling frequency
            this.adjustPollingForMemoryPressure('low', 0.8);
        }
    }

    /**
     * Adjust polling intervals based on memory pressure level
     * @param {string} level - Memory pressure level (critical, high, low)
     * @param {number} factor - Adjustment factor
     */
    adjustPollingForMemoryPressure(level, factor) {
        let adjustedCount = 0;
        
        for (const [guildId, data] of this.guildPollingData) {
            const oldInterval = data.currentInterval;
            
            if (level === 'critical' || level === 'high') {
                // Increase interval (reduce frequency)
                data.currentInterval = Math.min(data.currentInterval * factor, this.maxPollingInterval);
            } else if (level === 'low') {
                // Decrease interval (increase frequency) but respect minimum
                data.currentInterval = Math.max(data.currentInterval * factor, this.minPollingInterval);
            }
            
            if (oldInterval !== data.currentInterval) {
                adjustedCount++;
                this.startPolling(guildId); // Restart with new interval
            }
        }
        
        if (adjustedCount > 0) {
            console.log(`Adjusted polling for ${adjustedCount} guilds due to ${level} memory pressure (factor: ${factor})`);
        }
    }

    /**
     * Force update polling interval for a guild (for testing/debugging)
     * @param {string} guildId - Guild ID
     * @param {number} intervalMs - New interval in milliseconds
     */
    forceUpdateInterval(guildId, intervalMs) {
        const pollingData = this.guildPollingData.get(guildId);
        if (!pollingData) return false;

        pollingData.currentInterval = Math.max(this.minPollingInterval, 
                                              Math.min(this.maxPollingInterval, intervalMs));
        this.startPolling(guildId);
        return true;
    }
}

module.exports = SmartPollingManager;