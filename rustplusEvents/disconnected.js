const fs = require('fs');

module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

        if (rustplus.interaction && !instances[rustplus.guildId].connect) {
            rustplus.interaction.editReply({
                content: ':white_check_mark: Successfully Disconnected!',
                ephemeral: true
            });
            rustplus.log('Successfully Disconnected!');
            rustplus.interaction = null;
        }

        /* Clear the current interval of inGameEventHandler */
        clearInterval(rustplus.intervalId);
    },
};