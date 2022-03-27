module.exports = {
    name: 'rateLimit',
    async execute(client, info) {
        client.log(
            'RATELIMIT',
            `Timeout: ${info.timeout}, ` +
            `Limit: ${info.limit}, ` +
            `Method: ${info.method}, ` +
            `Path: ${info.path}, ` +
            `Route: ${info.route}, ` +
            `Global: ${info.global}`);
    },
}