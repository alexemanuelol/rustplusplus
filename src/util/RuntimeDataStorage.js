/*
    Copyright (C) 2026

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

let DatabaseSync = null;
try {
    ({ DatabaseSync } = require('node:sqlite'));
}
catch (e) {
    /* node:sqlite unavailable in this runtime. */
}

const DATABASE_FILE_NAME = 'runtimeData.sqlite';
const TABLE_NAME = 'runtime_server_state';

class RuntimeDataStorage {
    constructor(options = {}) {
        this.dataPath = options.dataPath ?? Path.join(__dirname, '..', '..', 'data');
        this.databasePath = options.databasePath ?? Path.join(this.dataPath, DATABASE_FILE_NAME);

        this.db = null;
        this.statements = null;

        if (DatabaseSync === null) {
            throw new Error(
                'node:sqlite is unavailable. Runtime data persistence requires Node.js 22+ in this build.'
            );
        }

        if (!Fs.existsSync(this.dataPath)) {
            Fs.mkdirSync(this.dataPath, { recursive: true });
        }

        this.db = new DatabaseSync(this.databasePath);
        this.prepareDatabase();
        this.prepareStatements();
    }

    close() {
        if (this.db !== null) {
            this.db.close();
            this.db = null;
        }
    }

    getServerState(guildId, serverId, stateKey) {
        const row = this.statements.getServerState.get(
            this.normalize(guildId),
            this.normalize(serverId),
            this.normalize(stateKey)
        );
        if (row === undefined) return null;

        try {
            return JSON.parse(row.value_json);
        }
        catch (e) {
            return null;
        }
    }

    setServerState(guildId, serverId, stateKey, value) {
        this.statements.upsertServerState.run(
            this.normalize(guildId),
            this.normalize(serverId),
            this.normalize(stateKey),
            JSON.stringify(value),
            Date.now()
        );
    }

    deleteServerState(guildId, serverId, stateKey) {
        this.statements.deleteServerState.run(
            this.normalize(guildId),
            this.normalize(serverId),
            this.normalize(stateKey)
        );
    }

    prepareDatabase() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
                guild_id TEXT NOT NULL,
                server_id TEXT NOT NULL,
                state_key TEXT NOT NULL,
                value_json TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (guild_id, server_id, state_key)
            );
        `);
    }

    prepareStatements() {
        this.statements = {
            getServerState: this.db.prepare(`
                SELECT value_json
                FROM ${TABLE_NAME}
                WHERE guild_id = ? AND server_id = ? AND state_key = ?
            `),
            upsertServerState: this.db.prepare(`
                INSERT INTO ${TABLE_NAME} (guild_id, server_id, state_key, value_json, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(guild_id, server_id, state_key)
                DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
            `),
            deleteServerState: this.db.prepare(`
                DELETE FROM ${TABLE_NAME}
                WHERE guild_id = ? AND server_id = ? AND state_key = ?
            `)
        };
    }

    normalize(value) {
        if (typeof (value) === 'string') return value;
        return `${value}`;
    }
}

module.exports = RuntimeDataStorage;
