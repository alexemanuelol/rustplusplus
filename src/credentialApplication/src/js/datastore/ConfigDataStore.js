const ElectronStore = new (require('electron-store'))();
const { v4: uuidv4 } = require('uuid');

const KEY_STEAM_ID = 'steam_id';
const KEY_RUSTPLUS_TOKEN = 'rustplus_token';
const KEY_EXPO_DEVICE_ID = 'expo_device_id';

class ConfigDataStore {
    static getSteamId() {
        return ElectronStore.get(KEY_STEAM_ID);
    }

    static setSteamId(steamId) {
        ElectronStore.set(KEY_STEAM_ID, steamId);
    }

    static clearSteamId() {
        ElectronStore.delete(KEY_STEAM_ID);
    }

    static getRustPlusToken() {
        return ElectronStore.get(KEY_RUSTPLUS_TOKEN);
    }

    static setRustPlusToken(rustPlusToken) {
        ElectronStore.set(KEY_RUSTPLUS_TOKEN, rustPlusToken);
    }

    static clearRustPlusToken() {
        ElectronStore.delete(KEY_RUSTPLUS_TOKEN);
    }

    static getExpoDeviceId() {
        let expoDeviceId = ElectronStore.get(KEY_EXPO_DEVICE_ID);

        /* Generate an expo device id if not set */
        if (!expoDeviceId) {
            expoDeviceId = uuidv4();
            this.setExpoDeviceId(expoDeviceId);
        }

        return expoDeviceId;
    }

    static setExpoDeviceId(expoDeviceId) {
        ElectronStore.set(KEY_EXPO_DEVICE_ID, expoDeviceId);
    }

    static clearExpoDeviceId() {
        ElectronStore.delete(KEY_EXPO_DEVICE_ID);
    }
}

module.exports = ConfigDataStore;