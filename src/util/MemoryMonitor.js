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

class MemoryMonitor {
    constructor() {
        this.memoryHistory = [];
        this.maxHistorySize = 100;
        this.gcThreshold = 0.8; // Trigger GC hint when memory usage exceeds 80%
        this.lastGcHint = 0;
        this.gcCooldown = 30000; // 30 seconds between GC hints
        this.monitoring = false;
        this.monitoringInterval = null;
        this.logger = null;
    }

    /**
     * Set logger instance for memory monitoring
     * @param {Object} logger - Logger instance
     */
    setLogger(logger) {
        this.logger = logger;
    }

    /**
     * Start memory monitoring
     * @param {number} interval - Monitoring interval in milliseconds (default: 60000)
     */
    startMonitoring(interval = 60000) {
        if (this.monitoring) {
            return;
        }

        this.monitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMemoryStats();
        }, interval);

        if (this.logger) {
            this.logger.log('Memory Monitor', 'Started memory monitoring', 'info');
        }
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (!this.monitoring) {
            return;
        }

        this.monitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.logger) {
            this.logger.log('Memory Monitor', 'Stopped memory monitoring', 'info');
        }
    }

    /**
     * Collect current memory statistics
     * @returns {Object} Memory statistics
     */
    collectMemoryStats() {
        const memUsage = process.memoryUsage();
        const timestamp = Date.now();
        
        const stats = {
            timestamp,
            rss: memUsage.rss, // Resident Set Size
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
            heapUtilization: (memUsage.heapUsed / memUsage.heapTotal) * 100
        };

        // Add to history
        this.memoryHistory.push(stats);
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }

        // Check if GC hint is needed
        this.checkGcHint(stats);

        // Log memory stats if logger is available
        if (this.logger && this.memoryHistory.length % 5 === 0) { // Log every 5th collection
            this.logMemoryStats(stats);
        }

        return stats;
    }

    /**
     * Check if garbage collection hint should be triggered
     * @param {Object} stats - Current memory statistics
     */
    checkGcHint(stats) {
        const now = Date.now();
        const timeSinceLastGc = now - this.lastGcHint;
        
        // Only trigger GC hint if:
        // 1. Heap utilization exceeds threshold
        // 2. Enough time has passed since last GC hint
        // 3. Memory trend is increasing
        if (stats.heapUtilization > this.gcThreshold * 100 && 
            timeSinceLastGc > this.gcCooldown &&
            this.isMemoryTrendIncreasing()) {
            
            this.triggerGcHint();
            this.lastGcHint = now;
        }
    }

    /**
     * Check if memory usage trend is increasing
     * @returns {boolean} True if memory is trending upward
     */
    isMemoryTrendIncreasing() {
        if (this.memoryHistory.length < 3) {
            return false;
        }

        const recent = this.memoryHistory.slice(-3);
        const trend = recent[2].heapUsed - recent[0].heapUsed;
        return trend > 0;
    }

    /**
     * Trigger garbage collection hint
     */
    triggerGcHint() {
        if (global.gc) {
            global.gc();
            if (this.logger) {
                this.logger.log('Memory Monitor', 'Triggered garbage collection', 'info');
            }
        } else {
            // Suggest manual GC trigger
            if (this.logger) {
                this.logger.log('Memory Monitor', 
                    'High memory usage detected. Consider running with --expose-gc flag for automatic GC hints', 
                    'warn');
            }
        }
    }

    /**
     * Log memory statistics
     * @param {Object} stats - Memory statistics to log
     */
    logMemoryStats(stats) {
        const rssMB = (stats.rss / 1024 / 1024).toFixed(2);
        const heapUsedMB = (stats.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (stats.heapTotal / 1024 / 1024).toFixed(2);
        const utilization = stats.heapUtilization.toFixed(1);

        this.logger.log('Memory Stats', 
            `RSS: ${rssMB}MB, Heap: ${heapUsedMB}/${heapTotalMB}MB (${utilization}%)`, 
            'info');
    }

    /**
     * Get current memory statistics
     * @returns {Object} Current memory stats
     */
    getCurrentStats() {
        return this.collectMemoryStats();
    }

    /**
     * Get memory history
     * @param {number} count - Number of recent entries to return
     * @returns {Array} Memory history entries
     */
    getHistory(count = 10) {
        return this.memoryHistory.slice(-count);
    }

    /**
     * Get memory usage summary
     * @returns {Object} Memory usage summary
     */
    getSummary() {
        if (this.memoryHistory.length === 0) {
            return null;
        }

        const recent = this.memoryHistory.slice(-10);
        const avgHeapUsed = recent.reduce((sum, stat) => sum + stat.heapUsed, 0) / recent.length;
        const avgUtilization = recent.reduce((sum, stat) => sum + stat.heapUtilization, 0) / recent.length;
        const maxHeapUsed = Math.max(...recent.map(stat => stat.heapUsed));
        const minHeapUsed = Math.min(...recent.map(stat => stat.heapUsed));

        return {
            averageHeapUsed: avgHeapUsed,
            averageUtilization: avgUtilization,
            maxHeapUsed: maxHeapUsed,
            minHeapUsed: minHeapUsed,
            samples: recent.length,
            timespan: recent.length > 1 ? recent[recent.length - 1].timestamp - recent[0].timestamp : 0
        };
    }

    /**
     * Clear memory history
     */
    clearHistory() {
        this.memoryHistory = [];
    }

    /**
     * Set GC threshold
     * @param {number} threshold - Threshold between 0 and 1
     */
    setGcThreshold(threshold) {
        if (threshold >= 0 && threshold <= 1) {
            this.gcThreshold = threshold;
        }
    }

    /**
     * Force garbage collection if available
     */
    forceGc() {
        if (global.gc) {
            global.gc();
            if (this.logger) {
                this.logger.log('Memory Monitor', 'Forced garbage collection', 'info');
            }
            return true;
        }
        return false;
    }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

module.exports = {
    MemoryMonitor,
    memoryMonitor
};