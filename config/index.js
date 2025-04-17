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
        pollingIntervalMs: process.env.RPP_POLLING_INTERVAL || 7500,
        showCallStackError: true,
        reconnectIntervalMs: process.env.RPP_RECONNECT_INTERVAL || 15000,
    },
    discord: {
        username: process.env.RPP_DISCORD_USERNAME || 'BigRaidHunter',
        clientId: process.env.RPP_DISCORD_CLIENT_ID || '349129013165293571',
        token: process.env.RPP_DISCORD_TOKEN || 'MzQ5MTI5MDEzMTY1MjkzNTcx.G5CKZt.rEF5T5HjpPKN_nTKtMu62Qk-WLuWR2-DMrTXWg',
        needAdminPrivileges: process.env.RPP_NEED_ADMIN_PRIVILEGES || true, /* If true, only admins can delete (server, switch..), manage credentials and reset a channel */
    }
};
