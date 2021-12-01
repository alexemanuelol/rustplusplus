module.exports = {
    name: 'disconnected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS DISCONNECTED');

        let instance = client.readInstanceFile(rustplus.guildId);

        if (rustplus.interaction && !instance.generalSettings.connect) {
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