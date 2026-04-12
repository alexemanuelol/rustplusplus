/*
    Copyright (C) 2026 FaiThiX

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

    https://github.com/faithix/rustplusplus

*/

const Constants = require('./constants.js');

function normalizeInput(input) {
    if (typeof input !== 'string') return '';

    let normalized = input.trim();

    if (normalized.startsWith('<') && normalized.endsWith('>')) {
        normalized = normalized.slice(1, -1).trim();
    }

    return normalized;
}

function isSteamId64(input) {
    return new RegExp(`^\\d{${Constants.STEAMID64_LENGTH}}$`).test(input);
}

function isBattlemetricsPlayerId(input) {
    return /^\d+$/.test(input);
}

function parseSteamProfileUrl(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 2 || parts[0].toLowerCase() !== 'profiles') return null;

    const steamId = parts[1];
    return isSteamId64(steamId) ? steamId : null;
}

function parseSteamVanityUrl(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 2 || parts[0].toLowerCase() !== 'id') return null;

    const vanity = parts[1].trim();
    if (vanity === '') return null;

    return vanity;
}

function parseBattlemetricsPlayerUrl(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    const playersIndex = parts.findIndex(part => part.toLowerCase() === 'players');
    if (playersIndex === -1 || !parts[playersIndex + 1]) return null;

    const playerId = parts[playersIndex + 1];
    return isBattlemetricsPlayerId(playerId) ? playerId : null;
}

module.exports = {
    parseTrackerPlayerInput: function (input) {
        const normalizedInput = normalizeInput(input);

        if (normalizedInput === '') {
            return { valid: false, value: null, type: null, normalizedInput: normalizedInput };
        }

        if (isSteamId64(normalizedInput)) {
            return { valid: true, value: normalizedInput, type: 'steamId', normalizedInput: normalizedInput };
        }

        if (isBattlemetricsPlayerId(normalizedInput)) {
            return {
                valid: true,
                value: normalizedInput,
                type: 'battlemetricsId',
                normalizedInput: normalizedInput
            };
        }

        let url = null;
        try {
            url = new URL(normalizedInput);
        }
        catch (e) {
            return { valid: false, value: null, type: null, normalizedInput: normalizedInput };
        }

        const hostname = url.hostname.toLowerCase();

        if (hostname === 'steamcommunity.com' || hostname === 'www.steamcommunity.com') {
            const steamId = parseSteamProfileUrl(url.pathname);
            if (steamId) {
                return { valid: true, value: steamId, type: 'steamId', normalizedInput: normalizedInput };
            }

            const vanity = parseSteamVanityUrl(url.pathname);
            if (vanity) {
                return {
                    valid: true,
                    value: vanity,
                    type: 'steamVanityUrl',
                    normalizedInput: normalizedInput
                };
            }

            return { valid: false, value: null, type: null, normalizedInput: normalizedInput };
        }

        if (hostname === 'battlemetrics.com' ||
            hostname === 'www.battlemetrics.com' ||
            hostname === 'api.battlemetrics.com') {
            const battlemetricsId = parseBattlemetricsPlayerUrl(url.pathname);
            if (!battlemetricsId) {
                return { valid: false, value: null, type: null, normalizedInput: normalizedInput };
            }

            return {
                valid: true,
                value: battlemetricsId,
                type: 'battlemetricsId',
                normalizedInput: normalizedInput
            };
        }

        return { valid: false, value: null, type: null, normalizedInput: normalizedInput };
    }
};
