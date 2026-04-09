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

const pc = require("picocolors");
const Winston = require("winston");

const Config = require('../../config');

class Logger {
    constructor(logFilePath, type) {
        this.logger = Winston.createLogger({
            transports: [new Winston.transports.File({
                filename: logFilePath,
                maxsize: 10000000,
                maxFiles: 2,
                tailable: true
            })],
        });

        this.type = type;
        this.guildId = null;
        this.serverName = null;

        /* Deduplication state to suppress repeated identical log messages */
        this._lastLogKey = null;
        this._lastRepeatCount = 0;
    }

    setGuildId(guildId) {
        this.guildId = guildId;
    }

    getTime() {
        let d = new Date();

        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate() < 10 ? ('0' + d.getDate()) : d.getDate();
        let hours = d.getHours() < 10 ? ('0' + d.getHours()) : d.getHours();
        let minutes = d.getMinutes() < 10 ? ('0' + d.getMinutes()) : d.getMinutes();
        let seconds = d.getSeconds() < 10 ? ('0' + d.getSeconds()) : d.getSeconds();

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    }

    _flushRepeat(time) {
        if (this._lastRepeatCount <= 0) return;

        const msg = `... repeated ${this._lastRepeatCount} more time${this._lastRepeatCount > 1 ? 's' : ''}`;

        switch (this.type) {
            case 'default': {
                this.logger.log({ level: 'info', message: `${time} | ${msg}` });
                console.log(pc.green(`${time} `) + pc.yellow(msg));
            } break;

            case 'guild': {
                this.logger.log({
                    level: 'info',
                    message: `${time} | ${this.guildId} | ${this.serverName} | ${msg}`
                });
                console.log(
                    pc.green(`${time} `) +
                    pc.cyan(`${this.guildId} `) +
                    pc.white(`${this.serverName} `) +
                    pc.yellow(msg));
            } break;
        }

        this._lastRepeatCount = 0;
    }

    log(title, text, level) {
        let time = this.getTime();

        /* Deduplicate consecutive identical log messages */
        const logKey = `${title}|${text}|${level}`;
        if (logKey === this._lastLogKey) {
            this._lastRepeatCount++;
            return;
        }
        this._flushRepeat(time);
        this._lastLogKey = logKey;
        this._lastRepeatCount = 0;

        switch (this.type) {
            case 'default': {
                text = `${title}: ${text}`;
                this.logger.log({
                    level: level,
                    message: `${time} | ${text}`
                });

                console.log(
                    pc.green(`${time} `) +
                    ((level === 'error') ? pc.red(text) : pc.yellow(text))
                );

                if (level === 'error' && Config.general.showCallStackError) {
                    for (let line of (new Error().stack.split(/\r?\n/))) {
                        this.logger.log({ level: level, message: `${time} | ${line}` });
                        console.log(pc.green(`${time} `) + pc.red(line));
                    }
                }
            } break;

            case 'guild': {
                text = `${title}: ${text}`;

                this.logger.log({
                    level: level,
                    message: `${time} | ${this.guildId} | ${this.serverName} | ${text}`
                });

                console.log(
                    pc.green(`${time} `) +
                    pc.cyan(`${this.guildId} `) +
                    pc.white(`${this.serverName} `) +
                    ((level === 'error') ? pc.red(text) : pc.yellow(text))
                );

                if (level === 'error' && Config.general.showCallStackError) {
                    for (let line of (new Error().stack.split(/\r?\n/))) {
                        this.logger.log({
                            level: level,
                            message: `${time} | ${this.guildId} | ${this.serverName} | ${line}`
                        });
                        console.log(
                            pc.green(`${time} `) +
                            pc.cyan(`${this.guildId} `) +
                            pc.white(`${this.serverName} `) +
                            pc.red(line));
                    }
                }
            } break;

            default: {
            } break;
        }
    }
}

module.exports = Logger;