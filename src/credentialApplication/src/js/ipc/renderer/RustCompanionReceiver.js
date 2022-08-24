const Events = require('events');

/**
 * This class is responsible for communicating with the RustCompanionManager running
 * in the main process.
 *
 * Events are sent from here in the renderer process via ipc to the main process,
 * and results are then sent back to the renderer process via ipc.
 */
class RustCompanionReceiver extends Events.EventEmitter {
    constructor(ipcRenderer) {
        super();

        /* Global variables */
        this.ipcRenderer = ipcRenderer;

        /* Register ipc channel handlers */
        ipcRenderer.on('rust-companion-api.register.success', (event, data) => this.onRegisterSuccess(event, data));
        ipcRenderer.on('rust-companion-api.register.error', (event, data) => this.onRegisterError(event, data));
    }

    onRegisterSuccess(event, data) {
        this.emit('register.success', data);
    }

    onRegisterError(event, data) {
        this.emit('register.error', data);
    }

    /**
     * Ask the main process to register with Rust Companion API.
     *
     * Events Emitted:
     * - register.success
     * - register.error
     */
    register(deviceId, token, expoPushToken) {
        ipcRenderer.send('rust-companion-api.register', {
            deviceId: deviceId,
            token: token,
            expoPushToken: expoPushToken,
        });
    }
}

module.exports = RustCompanionReceiver;