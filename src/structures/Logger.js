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

const Colors = require("colors");
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

    log(title, text, level) {
        let time = this.getTime();

        switch (this.type) {
            case 'default': {
                text = `${title}: ${text}`;
                this.logger.log({
                    level: level,
                    message: `${time} | ${text}`
                });

                if (level === 'info') {
                    console.log(Colors.green(`${time} `) + Colors.yellow(text));
                }
                if (level === 'warn') {
                    console.log(Colors.green(`${time} `) + Colors.blue(text));
                }
                if (level === 'error') {
                    console.log(Colors.green(`${time} `) + Colors.red(text));
                }
                if (level === 'error' && Config.general.showCallStackError) {
                    for (let line of (new Error().stack.split(/\r?\n/))) {
                        this.logger.log({ level: level, message: `${time} | ${line}` });
                        console.log(Colors.green(`${time} `) + Colors.red(line));
                    }
                }
                
            } break;

            case 'guild': {
                text = `${title}: ${text}`;

                this.logger.log({
                    level: level,
                    message: `${time} | ${this.guildId} | ${this.serverName} | ${text}`
                });
                
                if (level === 'info') {
                    console.log(
                        Colors.green(`${time} `) +
                        Colors.cyan(`${this.guildId} `) +
                        Colors.white(`${this.serverName} `) +
                        Colors.yellow(text));
                }
                if (level === 'error') {
                    console.log(
                        Colors.green(`${time} `) + 
                        Colors.cyan(`${this.guildId} `) +
                        Colors.white(`${this.serverName} `) + 
                        Colors.red(text));
                };
                if (level === 'error' && Config.general.showCallStackError) {
                    for (let line of (new Error().stack.split(/\r?\n/))) {
                        this.logger.log({
                            level: level,
                            message: `${time} | ${this.guildId} | ${this.serverName} | ${line}`
                        });
                        console.log(
                            Colors.green(`${time} `) +
                            Colors.cyan(`${this.guildId} `) +
                            Colors.white(`${this.serverName} `) +
                            Colors.red(line));
                    }
                }
            } break;

            default: {
            } break;
        }
    }
}

module.exports = Logger;