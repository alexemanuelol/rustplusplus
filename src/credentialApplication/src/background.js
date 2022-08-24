import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const Electron = require('electron');
const ElectronStore = require('electron-store');

const ExpoPushTokenManager = require('@/js/ipc/main/ExpoPushTokenManager');
const FCMNotificationManager = require('@/js/ipc/main/FCMNotificationManager');
const RustCompanionManager = require('@/js/ipc/main/RustCompanionManager');

const app = Electron.app;
const ipcMain = Electron.ipcMain;
const protocol = Electron.protocol;
const BrowserWindow = Electron.BrowserWindow;

/* Scheme must be registered before the app is ready */
protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: {
        secure: true,
        standard: true,
    }
}]);

/* Setup electron store */
ElectronStore.initRenderer();

/* Init ipc managers */
let expoPushTokenManager = new ExpoPushTokenManager(ipcMain);
let fcmNotificationManager = new FCMNotificationManager(ipcMain);
let rustCompanionManager = new RustCompanionManager(ipcMain);

/* Init ipc callback to auth with rust+ */
ipcMain.on('connect-with-rustplus', (ipcEvent, data) => {
    let authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            enableRemoteModule: true,
            contextIsolation: false, /* Required for preload to work in browser */
            preload: __dirname + '/preload.js'
        }
    });

    /* Listen for ipc callback from ReactNativeWebView.postMessage injected into the rust+ login website */
    ipcMain.on('connect-with-rustplus.react-native-callback', (_, data) => {
        /* Forward auth data to original ipc caller of 'connect-with-rustplus' */
        ipcEvent.sender.send('connect-with-rustplus.success', {
            'steamId': data.steamId,
            'token': data.token,
        });

        /* Close auth window */
        authWindow.destroy();
    });

    /* Load rust+ companion login page */
    authWindow.loadURL('https://companion-rust.facepunch.com/login');
});

app.on('ready', () => {
    let window = new BrowserWindow({
        width: 800,
        height: 910,
        autoHideMenuBar: true,
        webPreferences: {
            enableRemoteModule: true,
            contextIsolation: false, /* Required for preload to work in browser */
            preload: __dirname + '/preload.js'
        }
    });

    /* Open links clicked in main window in external OS browser */
    window.webContents.on('new-window', async function (event, url) {
        event.preventDefault();
        await Electron.shell.openExternal(url);
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        /* Use local server in dev */
        window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    }
    else {
        createProtocol('app')

        /* Load the index.html when not in development */
        window.loadURL('app://./index.html')
    }
});