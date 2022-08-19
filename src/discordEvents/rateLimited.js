module.exports = {
    name: 'rateLimited',
    async execute(client, info) {
        client.log(
            'RATELIMITED',
            `Timeout: ${info.timeToReset}, ` +
            `Limit: ${info.limit}, ` +
            `Method: ${info.method}, ` +
            `Path: ${info.url}, ` +
            `Route: ${info.route}, ` +
            `Global: ${info.global}`);
    },
}