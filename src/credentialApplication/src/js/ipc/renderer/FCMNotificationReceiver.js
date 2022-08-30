const Events = require('events');

/**
 * This class is responsible for communicating with the FCMNotificationManager running
 * in the main process.
 *
 * Events are sent from here in the renderer process via ipc to the main process,
 * and results are then sent back to the renderer process via ipc.
 */
class FCMNotificationReceiver extends Events.EventEmitter {
    constructor(ipcRenderer) {
        super();

        /* Global variables */
        this.ipcRenderer = ipcRenderer;

        /* Register ipc channel handlers */
        ipcRenderer.on('push-receiver.register.success', (event, data) => this.onRegisterSuccess(event, data));
        ipcRenderer.on('push-receiver.register.error', (event, data) => this.onRegisterError(event, data));
    }

    onRegisterSuccess(event, data) {
        this.emit('register.success', data);
    }

    onRegisterError(event, data) {
        this.emit('register.error', data);
    }

    /**
     * Ask the main process to register a new android device
     * to receive fcm notifications for the provided senderId.
     *
     * Events Emitted:
     * - register.success
     * - register.error
     */
    register(senderId) {
        ipcRenderer.send('push-receiver.register', {
            senderId: senderId,
        });
    }
}

module.exports = FCMNotificationReceiver;