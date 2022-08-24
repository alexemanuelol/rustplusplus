const Axios = require('axios');

/**
 * This class is responsible for registering with the Rust Companion API.
 *
 * Events are received via ipc from the renderer process, executed here in the main
 * process, and results are then sent back to the renderer process via ipc.
 */
class RustCompanionManager {
    constructor(ipcMain) {
        /* Global variables */
        this.ipcMain = ipcMain;

        /* Register ipc channel handlers */
        ipcMain.on('rust-companion-api.register', (event, data) => this.onRegister(event, data));
    }

    onRegisterSuccess(event) {
        event.sender.send('rust-companion-api.register.success');
    }

    onRegisterError(event, error, responseCode) {
        event.sender.send('rust-companion-api.register.error', {
            'error': error,
            'response_code': responseCode,
        });
    }

    /**
     * Register with Rust Companion API
     * @param event
     * @param data
     */
    async onRegister(event, data) {
        /* Register with rust companion api */
        Axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
            AuthToken: data.token,
            DeviceId: data.deviceId,
            PushKind: 0,
            PushToken: data.expoPushToken,
        }).then((response) => {
            /* Success */
            this.onRegisterSuccess(event);
        }).catch((error) => {
            /* Get response status code */
            var responseCode = error.response ? error.response.status : 0;

            /* Return error */
            this.onRegisterError(event, error, responseCode);
        });
    }
}

module.exports = RustCompanionManager;