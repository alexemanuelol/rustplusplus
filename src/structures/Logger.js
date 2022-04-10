const winston = require("winston");
const colors = require("colors");

class Logger {
    constructor(logFilePath, type) {
        this.logger = winston.createLogger({
            transports: [new winston.transports.File({
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
            case 'default':
                text = `${title}: ${text}`;
                this.logger.log({
                    level: level,
                    message: `${time} | ${text}`
                });

                console.log(
                    colors.green(`${time} `) +
                    ((level === 'error') ? colors.red(text) : colors.yellow(text))
                );
                break;

            case 'guild':
                text = `${title}: ${text}`;

                this.logger.log({
                    level: level,
                    message: `${time} | ${this.guildId} | ${this.serverName} | ${text}`
                });

                console.log(
                    colors.green(`${time} `) +
                    colors.cyan(`${this.guildId} `) +
                    colors.white(`${this.serverName} `) +
                    ((level === 'error') ? colors.red(text) : colors.yellow(text))
                );
                break;

            default:
                break;
        }
    }
}

module.exports = Logger;