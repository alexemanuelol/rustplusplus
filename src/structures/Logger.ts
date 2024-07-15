/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import * as winston from 'winston';
import 'colors';

function colorizeLevel(level: string): string {
    switch (level) {
        case 'debug':
            return 'cyan';
        case 'info':
            return 'green';
        case 'warn':
            return 'yellow';
        case 'error':
            return 'red';
        default:
            return 'gray';
    }
}

export function createLogger(logFilePath: string): winston.Logger {
    /* Custom format to include additional metadata */
    const customFormatConsole = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            const coloredTimestamp = `${timestamp} `.green;
            const coloredLevel = `${level[colorizeLevel(level) as keyof String]} `;
            const coloredMessage = `${message} `.yellow;
            const coloredGuildId = metadata.guildId ? `${metadata.guildId} `.cyan : '';
            const coloredServerName = metadata.serverName ? `${metadata.serverName} `.white : '';

            return `${coloredTimestamp}${coloredLevel}${coloredGuildId}${coloredServerName}${coloredMessage}`
        })
    );

    const customFormatFile = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
            const coloredTimestamp = `${timestamp} `;
            const coloredLevel = `${level} `;
            const coloredMessage = `${message} `;
            const coloredGuildId = metadata.guildId ? `${metadata.guildId} ` : '';
            const coloredServerName = metadata.serverName ? `${metadata.serverName} ` : '';

            return `${coloredTimestamp}${coloredLevel}${coloredGuildId}${coloredServerName}${coloredMessage}`
        })
    );

    const logger = winston.createLogger({
        level: 'debug', /* Log level */
        transports: [
            /* Console transport */
            new winston.transports.Console({
                format: customFormatConsole
            }),
            /* File transport */
            new winston.transports.File({
                filename: logFilePath,
                maxsize: 10 * 1024 * 1024, /* 10MB in bytes */
                maxFiles: 5, /* Keep the last 5 log files */
                tailable: true, /* Ensure the log file names follow the pattern logfile.log, logfile.log.1 etc... */
                format: customFormatFile
            })
        ]
    });

    return logger;
}