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

module.exports = {
    general: {
        language: process.env.RPP_LANGUAGE || 'en',
        // FIX: Parse as integer since env vars are strings
        pollingIntervalMs: parseInt(process.env.RPP_POLLING_INTERVAL, 10) || 10000,
        // FIX: Properly parse boolean from string - only true if explicitly 'true'
        showCallStackError: process.env.RPP_LOG_CALL_STACK === 'true',
        // FIX: Parse as integer since env vars are strings
        reconnectIntervalMs: parseInt(process.env.RPP_RECONNECT_INTERVAL, 10) || 15000,
    },
    discord: {
        username: process.env.RPP_DISCORD_USERNAME || 'rustplusplus',
        clientId: process.env.RPP_DISCORD_CLIENT_ID || '',
        token: process.env.RPP_DISCORD_TOKEN || '',
        // FIX: Properly parse boolean - default to true unless explicitly set to 'false'
        needAdminPrivileges: process.env.RPP_NEED_ADMIN_PRIVILEGES !== 'false',
    }
};
