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

/**
 * Generic object pool for reducing memory allocation overhead
 * Manages pools of reusable objects to minimize garbage collection
 */
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10, maxSize = 100) {
        this.createFn = createFn;     // Function to create new objects
        this.resetFn = resetFn;       // Function to reset objects for reuse
        this.pool = [];               // Available objects
        this.maxSize = maxSize;       // Maximum pool size
        this.created = 0;             // Total objects created
        this.reused = 0;              // Total objects reused
        
        // Pre-populate pool with initial objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
            this.created++;
        }
    }

    /**
     * Get an object from the pool or create a new one
     * @returns {Object} Reusable object
     */
    acquire() {
        if (this.pool.length > 0) {
            this.reused++;
            return this.pool.pop();
        }
        
        this.created++;
        return this.createFn();
    }

    /**
     * Return an object to the pool for reuse
     * @param {Object} obj - Object to return to pool
     */
    release(obj) {
        if (!obj || this.pool.length >= this.maxSize) {
            return; // Don't store if pool is full
        }
        
        // Reset object state for reuse
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        this.pool.push(obj);
    }

    /**
     * Get pool statistics
     * @returns {Object} Pool usage statistics
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            maxSize: this.maxSize,
            totalCreated: this.created,
            totalReused: this.reused,
            reuseRatio: this.created > 0 ? (this.reused / this.created).toFixed(2) : 0
        };
    }

    /**
     * Clear the pool and reset statistics
     */
    clear() {
        this.pool.length = 0;
        this.created = 0;
        this.reused = 0;
    }

    /**
     * Resize the pool by removing excess objects
     * @param {number} targetSize - Target pool size
     */
    resize(targetSize) {
        while (this.pool.length > targetSize) {
            this.pool.pop();
        }
    }

    /**
     * Clean up excess objects from the pool
     * Removes objects when pool size exceeds 50% of max capacity
     */
    cleanup() {
        const targetSize = Math.floor(this.maxSize * 0.5);
        if (this.pool.length > targetSize) {
            this.resize(targetSize);
        }
    }
}

/**
 * Specialized pools for common objects in RustPlusPlus
 */
class RustPlusPlusObjectPools {
    constructor() {
        // Pool for position objects used in map calculations
        this.positionPool = new ObjectPool(
            () => ({ x: 0, y: 0, string: '', location: null }),
            (obj) => {
                obj.x = 0;
                obj.y = 0;
                obj.string = '';
                obj.location = null;
            },
            20, 100
        );

        // Pool for notification data objects
        this.notificationPool = new ObjectPool(
            () => ({ 
                guildId: null, 
                serverId: null, 
                color: null, 
                message: '', 
                steamId: null,
                name: '',
                location: null,
                time: null
            }),
            (obj) => {
                obj.guildId = null;
                obj.serverId = null;
                obj.color = null;
                obj.message = '';
                obj.steamId = null;
                obj.name = '';
                obj.location = null;
                obj.time = null;
            },
            15, 75
        );

        // Pool for vending machine order tracking objects
        this.vendingOrderPool = new ObjectPool(
            () => ({ vId: '', itemId: '', currencyId: '', amountInStock: 0 }),
            (obj) => {
                obj.vId = '';
                obj.itemId = '';
                obj.currencyId = '';
                obj.amountInStock = 0;
            },
            10, 50
        );

        // Pool for team change tracking objects
        this.teamChangePool = new ObjectPool(
            () => ({ steamId: '', name: '', action: '', location: null, time: null }),
            (obj) => {
                obj.steamId = '';
                obj.name = '';
                obj.action = '';
                obj.location = null;
                obj.time = null;
            },
            10, 50
        );
    }

    /**
     * Get a position object from the pool
     * @returns {Object} Position object
     */
    acquirePosition() {
        return this.positionPool.acquire();
    }

    /**
     * Return a position object to the pool
     * @param {Object} pos - Position object to return
     */
    releasePosition(pos) {
        this.positionPool.release(pos);
    }

    /**
     * Get a notification object from the pool
     * @returns {Object} Notification object
     */
    acquireNotification() {
        return this.notificationPool.acquire();
    }

    /**
     * Return a notification object to the pool
     * @param {Object} notification - Notification object to return
     */
    releaseNotification(notification) {
        this.notificationPool.release(notification);
    }

    /**
     * Get a vending order object from the pool
     * @returns {Object} Vending order object
     */
    acquireVendingOrder() {
        return this.vendingOrderPool.acquire();
    }

    /**
     * Return a vending order object to the pool
     * @param {Object} order - Vending order object to return
     */
    releaseVendingOrder(order) {
        this.vendingOrderPool.release(order);
    }

    /**
     * Get a team change object from the pool
     * @returns {Object} Team change object
     */
    acquireTeamChange() {
        return this.teamChangePool.acquire();
    }

    /**
     * Return a team change object to the pool
     * @param {Object} change - Team change object to return
     */
    releaseTeamChange(change) {
        this.teamChangePool.release(change);
    }

    /**
     * Get statistics for all object pools
     * @returns {Object} Pool statistics
     */
    getStats() {
        return {
            position: {
                active: this.positionPool.activeCount,
                total: this.positionPool.totalCount
            },
            notification: {
                active: this.notificationPool.activeCount,
                total: this.notificationPool.totalCount
            },
            vendingOrder: {
                active: this.vendingOrderPool.activeCount,
                total: this.vendingOrderPool.totalCount
            },
            teamChange: {
                active: this.teamChangePool.activeCount,
                total: this.teamChangePool.totalCount
            }
        };
    }

    /**
     * Clean up all object pools by removing excess objects
     */
    cleanup() {
        this.positionPool.cleanup();
        this.notificationPool.cleanup();
        this.vendingOrderPool.cleanup();
        this.teamChangePool.cleanup();
    }

    getAllStats() {
        return {
            position: this.positionPool.getStats(),
            notification: this.notificationPool.getStats(),
            vendingOrder: this.vendingOrderPool.getStats(),
            teamChange: this.teamChangePool.getStats()
        };
    }

    /**
     * Clear all pools
     */
    clearAll() {
        this.positionPool.clear();
        this.notificationPool.clear();
        this.vendingOrderPool.clear();
        this.teamChangePool.clear();
    }

    /**
     * Resize all pools to optimize memory usage
     * @param {number} factor - Resize factor (0.5 = half size, 1.5 = 1.5x size)
     */
    resizeAll(factor = 0.8) {
        this.positionPool.resize(Math.floor(this.positionPool.maxSize * factor));
        this.notificationPool.resize(Math.floor(this.notificationPool.maxSize * factor));
        this.vendingOrderPool.resize(Math.floor(this.vendingOrderPool.maxSize * factor));
        this.teamChangePool.resize(Math.floor(this.teamChangePool.maxSize * factor));
    }
}

// Create singleton instance
const objectPools = new RustPlusPlusObjectPools();

module.exports = {
    ObjectPool,
    RustPlusPlusObjectPools,
    objectPools // Singleton instance for global use
};