const Axios = require('axios');
const Https = require('https');
const { v4: uuidv4 } = require('uuid');

/**
 * This class is responsible for obtaining an Expo Push Token.
 *
 * Events are received via ipc from the renderer process, executed here in the main
 * process, and results are then sent back to the renderer process via ipc.
 */
class ExpoPushTokenManager {
    constructor(ipcMain) {
        /* Global variables */
        this.ipcMain = ipcMain;

        /* Register ipc channel handlers */
        ipcMain.on('expo-push-token.register', (event, data) => this.onRegister(event, data));
    }

    onRegisterSuccess(event, expoPushToken) {
        event.sender.send('expo-push-token.register.success', {
            'expoPushToken': expoPushToken,
        });
    }

    onRegisterError(event, error) {
        event.sender.send('expo-push-token.register.error', {
            'error': error,
        });
    }

    /**
     * Get an Expo Push Token
     * @param event
     * @param data
     */
    async onRegister(event, data) {
        /* Register with expo */
        Axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
            deviceId: uuidv4(),
            experienceId: data.experienceId,
            appId: data.appId,
            deviceToken: data.deviceToken,
            type: data.type,
            development: data.development,
        }, {
            /**
             * todo: this is insecure and should not be used, but electron v11 is not going to backport the fix
             * ignores invalid ssl certificates when registering for expo push token
             * temporary fix for: https://github.com/liamcottle/atlas-for-rust/issues/5
             */
            httpsAgent: new Https.Agent({
                rejectUnauthorized: false
            })
        }).then((response) => {
            /* Return expo push token */
            this.onRegisterSuccess(event, response.data.data.expoPushToken);
        }).catch((error) => {
            /* Return error */
            this.onRegisterError(event, error);
        });
    }
}

module.exports = ExpoPushTokenManager;