const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log('ERROR', err, 'error')

        switch (err.code) {
            case 'ETIMEDOUT': {
                errorTimedOut(rustplus, client, err);
            } break;

            case 'ENOTFOUND': {
                errorNotFound(rustplus, client, err);
            } break;

            case 'ECONNREFUSED': {
                await errorConnRefused(rustplus, client, err);
            } break;

            default: {
                errorOther(rustplus, client, err);
            } break;
        }
    },
};

function errorTimedOut(rustplus, client, err) {
    if (err.syscall === 'connect') {
        rustplus.log('ERROR', `Could not connect to: ${rustplus.serverId}.`, 'error');
    }
}

function errorNotFound(rustplus, client, err) {
    if (err.syscall === 'getaddrinfo') {
        rustplus.log('ERROR', `Could not connect to: ${rustplus.serverId}.`, 'error');
    }
}

async function errorConnRefused(rustplus, client, err) {
    rustplus.log('ERROR', `Connection refused to: ${rustplus.serverId}.`, 'error');

    if (!rustplus.isConnectionRefused) {
        await DiscordMessages.sendServerChangeStateMessage(rustplus.guildId, rustplus.serverId, 1);
        await DiscordMessages.sendServerMessage(rustplus.guildId, rustplus.serverId, 2);
    }

    rustplus.isReconnecting = true;
    rustplus.isConnectionRefused = true;

    setTimeout(() => {
        rustplus.log('RECONNECTING', 'RECONNECTING TO SERVER...');
        rustplus.connect();
    }, 20000);
}

function errorOther(rustplus, client, err) {
    if (err.toString() === 'Error: WebSocket was closed before the connection was established') {
        rustplus.log('ERROR', 'WebSocket was closed before the connection was established.', 'error');
    }
}