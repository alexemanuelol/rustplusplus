/*
    Copyright (C) 2024 rustplusplus

    Activity Tracker Utility
    Analyzes player activity logs to produce play-time statistics and reports.

*/

const Timer = require('./timer.js');

const ACTIVITY_LOG_MAX_SIZE = 200;

module.exports = {
    ACTIVITY_LOG_MAX_SIZE,

    /**
     *  Record an activity event (login/logout) for a tracked player.
     *  Mutates the player object's activityLog in-place.
     *  @param {object} player The tracker player object (must have activityLog array).
     *  @param {number} type 0 = login, 1 = logout.
     *  @param {string} time ISO timestamp string.
     */
    recordActivity: function (player, type, time) {
        if (!player.hasOwnProperty('activityLog')) {
            player.activityLog = [];
        }

        const newTimeMs = new Date(time).getTime();

        /* Handle cases where the new event is the same type as the last one */
        if (player.activityLog.length > 0 && player.activityLog[0].type === type) {
            const lastTimeMs = new Date(player.activityLog[0].time).getTime();
            const diffMins = Math.abs(newTimeMs - lastTimeMs) / (1000 * 60);

            /* If it's practically the same time (within 2 mins), don't duplicate. 
               Keep the earlier one for accurate session starts. */
            if (diffMins < 2) {
                if (newTimeMs < lastTimeMs) {
                    player.activityLog[0].time = time;
                }
                return;
            }
            /* If it's the same type but far apart, it's likely we missed the 
               intermediate event (e.g. missed a logout). We'll allow the new one 
               to start a fresh record of state. */
        }

        if (player.activityLog.length >= ACTIVITY_LOG_MAX_SIZE) {
            player.activityLog.pop();
        }

        player.activityLog.unshift({ type: type, time: time });
    },

    /**
     *  Calculate total play time from an activity log within a given time window.
     *  @param {Array} activityLog Array of { type, time } entries (newest first).
     *  @param {number} windowMs Time window in milliseconds (e.g. 7 days). If null, use all data.
     *  @return {object} { totalOnlineMs, totalOfflineMs, sessions, firstEvent, lastEvent }
     */
    calculatePlayTime: function (activityLog, windowMs = null) {
        if (!activityLog || activityLog.length === 0) {
            return { totalOnlineMs: 0, totalOfflineMs: 0, sessions: 0, firstEvent: null, lastEvent: null };
        }

        const now = Date.now();
        const windowStart = windowMs !== null ? now - windowMs : 0;

        /* Sort chronologically (oldest first) for processing */
        const sorted = [...activityLog]
            .map(e => ({ type: e.type, time: new Date(e.time).getTime() }))
            .filter(e => e.time >= windowStart)
            .sort((a, b) => a.time - b.time);

        if (sorted.length === 0) {
            return { totalOnlineMs: 0, totalOfflineMs: 0, sessions: 0, firstEvent: null, lastEvent: null };
        }

        let totalOnlineMs = 0;
        let totalOfflineMs = 0;
        let sessions = 0;

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            const duration = next.time - current.time;

            if (current.type === 0) { /* Login → was online until next event */
                totalOnlineMs += duration;
                sessions++;
            } else { /* Logout → was offline until next event */
                totalOfflineMs += duration;
            }
        }

        /* Handle the last event to now */
        const lastEvent = sorted[sorted.length - 1];
        const timeSinceLast = now - lastEvent.time;
        if (lastEvent.type === 0) { /* Currently online */
            totalOnlineMs += timeSinceLast;
            sessions++;
        } else {
            totalOfflineMs += timeSinceLast;
        }

        return {
            totalOnlineMs,
            totalOfflineMs,
            sessions,
            firstEvent: new Date(sorted[0].time).toISOString(),
            lastEvent: new Date(lastEvent.time).toISOString()
        };
    },

    /**
     *  Get hourly activity breakdown (which hours of the day the player is most active).
     *  @param {Array} activityLog Array of { type, time } entries.
     *  @return {Array} Array of 24 numbers representing minutes online per hour slot.
     */
    getHourlyBreakdown: function (activityLog, windowMs = null) {
        const hours = new Array(24).fill(0);

        if (!activityLog || activityLog.length < 2) return hours;

        const now = Date.now();
        const windowStart = windowMs !== null ? now - windowMs : 0;

        const sorted = [...activityLog]
            .map(e => ({ type: e.type, time: new Date(e.time).getTime() }))
            .filter(e => e.time >= windowStart)
            .sort((a, b) => a.time - b.time);

        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].type !== 0) continue; /* Only count login→logout sessions */

            const sessionStart = sorted[i].time;
            const sessionEnd = sorted[i + 1].time;

            /* Walk through each hour in the session */
            let cursor = sessionStart;
            while (cursor < sessionEnd) {
                const hour = new Date(cursor).getHours();
                const nextHourStart = new Date(cursor);
                nextHourStart.setMinutes(0, 0, 0);
                nextHourStart.setHours(nextHourStart.getHours() + 1);

                const sliceEnd = Math.min(nextHourStart.getTime(), sessionEnd);
                const minutesInSlice = (sliceEnd - cursor) / (1000 * 60);

                hours[hour] += minutesInSlice;
                cursor = sliceEnd;
            }
        }

        return hours;
    },

    /**
     *  Format hourly breakdown into a visual bar chart string for Discord embed.
     *  @param {Array} hours Array of 24 numbers (minutes per hour).
     *  @return {string} Formatted string with bar chart.
     */
    formatHourlyChart: function (hours) {
        const maxMinutes = Math.max(...hours, 1); /* Avoid division by zero */
        const barChars = ['░', '▒', '▓', '█'];
        let chart = '';

        for (let h = 0; h < 24; h++) {
            const ratio = hours[h] / maxMinutes;
            const barLength = Math.round(ratio * 8);
            const hourLabel = h.toString().padStart(2, '0');

            let bar = '';
            for (let b = 0; b < 8; b++) {
                if (b < barLength) {
                    if (ratio > 0.75) bar += barChars[3];
                    else if (ratio > 0.50) bar += barChars[2];
                    else if (ratio > 0.25) bar += barChars[1];
                    else bar += barChars[0];
                } else {
                    bar += '░';
                }
            }

            const mins = Math.round(hours[h]);
            chart += `\`${hourLabel}:00\` ${bar} ${mins > 0 ? `${mins}m` : ''}\n`;
        }

        return chart;
    },

    /**
     *  Generate a summary report object for a player.
     *  @param {object} player The tracker player object with activityLog.
     *  @return {object} Report with stats for 24h, 7d, 30d, and all-time.
     */
    generateReport: function (player) {
        const log = player.activityLog || [];

        const DAY_MS = 24 * 60 * 60 * 1000;

        const stats24h = this.calculatePlayTime(log, 1 * DAY_MS);
        const stats7d = this.calculatePlayTime(log, 7 * DAY_MS);
        const stats30d = this.calculatePlayTime(log, 30 * DAY_MS);
        const statsAll = this.calculatePlayTime(log, null);

        /* Use last 7 days for hourly breakdown to keep data fresh */
        const hourly = this.getHourlyBreakdown(log, 7 * DAY_MS);
        const hourlyToday = this.getHourlyBreakdown(log, 1 * DAY_MS);

        /* Find likely sleep window (longest contiguous period of low activity) */
        let sleepStart = 0;
        let maxInactiveLength = 0;
        let currentInactiveStart = -1;
        let currentInactiveLength = 0;

        /* Find likely play window (longest contiguous period of high activity) */
        let playStart = 0;
        let maxActiveLength = 0;
        let currentActiveStart = -1;
        let currentActiveLength = 0;

        /* Double the hourly array to handle wrap-around (midnight) */
        const doubledHourly = [...hourly, ...hourly];
        for (let i = 0; i < doubledHourly.length; i++) {
            /* Sleep logic */
            if (doubledHourly[i] < 10) { /* Less than 10 mins active in the hour */
                if (currentInactiveStart === -1) currentInactiveStart = i % 24;
                currentInactiveLength++;
            } else {
                if (currentInactiveLength > maxInactiveLength) {
                    maxInactiveLength = currentInactiveLength;
                    sleepStart = currentInactiveStart;
                }
                currentInactiveStart = -1;
                currentInactiveLength = 0;
            }

            /* Play logic */
            if (doubledHourly[i] >= 10) { /* At least 10 mins active in the hour */
                if (currentActiveStart === -1) currentActiveStart = i % 24;
                currentActiveLength++;
            } else {
                if (currentActiveLength > maxActiveLength) {
                    maxActiveLength = currentActiveLength;
                    playStart = currentActiveStart;
                }
                currentActiveStart = -1;
                currentActiveLength = 0;
            }
        }
        
        /* One last check if the longest period was at the end */
        if (currentInactiveLength > maxInactiveLength) {
            maxInactiveLength = currentInactiveLength;
            sleepStart = currentInactiveStart;
        }
        if (currentActiveLength > maxActiveLength) {
            maxActiveLength = currentActiveLength;
            playStart = currentActiveStart;
        }

        let sleepWindow = 'Unknown';
        if (maxInactiveLength >= 4 && maxInactiveLength < 24) {
            const endHour = (sleepStart + maxInactiveLength) % 24;
            sleepWindow = `${sleepStart.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
        } else if (maxInactiveLength >= 24) {
            sleepWindow = 'Inactive (No data)';
        }

        let playWindow = 'Unknown';
        if (maxActiveLength >= 2 && maxActiveLength < 24) {
            const endHour = (playStart + maxActiveLength) % 24;
            playWindow = `${playStart.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
        } else if (maxActiveLength >= 24) {
            playWindow = '24/7 (Always ON)';
        }

        /* Find peak hours (top 3) */
        const peakHours = hourly
            .map((mins, hour) => ({ hour, mins }))
            .sort((a, b) => b.mins - a.mins)
            .slice(0, 3)
            .filter(e => e.mins > 0);

        /* Determine if currently online (last event is a login) */
        const isOnline = log.length > 0 && log[0].type === 0;

        /* Get last connected and last disconnected times */
        const lastConnected = log.find(e => e.type === 0)?.time || null;
        const lastDisconnected = log.find(e => e.type === 1)?.time || null;
        const lastSeen = isOnline ? new Date().toISOString() : (lastDisconnected || lastConnected);

        return {
            playerName: player.name,
            isOnline,
            lastSeen,
            lastConnected,
            lastDisconnected,
            sleepWindow,
            playWindow,
            stats24h,
            stats7d,
            stats30d,
            statsAll,
            hourly,
            hourlyToday,
            peakHours,
            totalEvents: log.length
        };
    },

    /**
     *  Format milliseconds into a human-readable time string.
     *  @param {number} ms Milliseconds.
     *  @return {string} Formatted time string.
     */
    formatMs: function (ms) {
        const seconds = Math.floor(ms / 1000);
        return Timer.secondsToFullScale(seconds, 's');
    },

    /**
     *  Format a percentage.
     *  @param {number} online Online milliseconds.
     *  @param {number} total Total milliseconds (online + offline).
     *  @return {string} Formatted percentage.
     */
    formatPercentage: function (online, total) {
        if (total === 0) return '0%';
        return `${Math.round((online / total) * 100)}%`;
    }
};
