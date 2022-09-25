module.exports = {
    name: 'rateLimited',
    async execute(client, info) {
        client.log(
            client.intlGet(null, 'ratelimited'),
            `Timeout: ${info.timeToReset}, ` +
            `Limit: ${info.limit}, ` +
            `Method: ${info.method}, ` +
            `Path: ${info.url}, ` +
            `Route: ${info.route}, ` +
            `Global: ${info.global}`);
    },
}