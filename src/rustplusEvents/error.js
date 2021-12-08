module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        rustplus.log(JSON.stringify(err));

        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            if (rustplus.interaction) {
                rustplus.interaction.editReply({
                    content: `:x: Could not connect to: **${rustplus.serverIp}:${rustplus.appPort}**`,
                    ephemeral: true
                });
                rustplus.log(`Could not connect to: ${rustplus.serverIp}:${rustplus.appPort}`);
            }
        }
        else if (err.code === 'ENOTFOUND' && err.stscall === 'getaddrinfo') {

        }
    },
};