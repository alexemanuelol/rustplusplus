module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        console.log(`ERROR:\n${err}`);

        if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
            if (rustplus.interaction) {
                rustplus.interaction.editReply({
                    content: `:x: Could not connect to: **${rustplus.serverIp}:${rustplus.appPort}**`,
                    ephemeral: true
                });
            }
        }
    },
};