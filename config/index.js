module.exports = {
    general: {
        pollingIntervalMs: process.env.RPP_POLLING_INTERVAL || 10000,
        showCallStackError: process.env.RPP_LOG_CALL_STACK || false
    },
    discord: {
        username: process.env.RPP_DISCORD_USERNAME || 'rustPlusPlus',
        clientId: process.env.RPP_DISCORD_CLIENT_ID || "",
        token: process.env.RPP_DISCORD_TOKEN || ""
    }
};
