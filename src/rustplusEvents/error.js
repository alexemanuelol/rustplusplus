module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        rustplus.log('ERROR', JSON.stringify(err), 'error');

        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            rustplus.log('ERROR', `Could not connect to: ${rustplus.server}:${rustplus.port}`, 'error');
        }
        else if (err.code === 'ENOTFOUND' && err.stscall === 'getaddrinfo') {

        }
    },
};