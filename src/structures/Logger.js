const winston = require("winston");
const colors = require("colors");

class Logger {
    constructor(logFilePath, guildId = '') {
        this.logger = winston.createLogger({
            transports: [new winston.transports.File({ filename: logFilePath })],
        });

        this.guildId = guildId;
    }

    log(text) {
        let d = new Date();

        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate() < 10 ? ('0' + d.getDate()) : d.getDate();
        let hours = d.getHours() < 10 ? ('0' + d.getHours()) : d.getHours();
        let minutes = d.getMinutes() < 10 ? ('0' + d.getMinutes()) : d.getMinutes();
        let seconds = d.getSeconds() < 10 ? ('0' + d.getSeconds()) : d.getSeconds();

        let time = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

        this.logger.log({
            level: 'info',
            message: `${time} ${this.guildId} | INFO: ${text}`,
        });

        console.log(
            colors.green(`${time} `) +
            colors.cyan(this.guildId) +
            colors.yellow(` | INFO: ` + text)
        );
    }
}

module.exports = Logger;