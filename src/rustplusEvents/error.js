module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        rustplus.log(JSON.stringify(err));

        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            rustplus.log(`Could not connect to: ${rustplus.server}:${rustplus.port}`);
        }
        else if (err.code === 'ENOTFOUND' && err.stscall === 'getaddrinfo') {

        }
    },
};