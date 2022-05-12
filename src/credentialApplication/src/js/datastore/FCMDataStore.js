const ElectronStore = new (require('electron-store'))();

const KEY_FCM_CREDENTIALS = 'fcm_credentials';
const KEY_FCM_PERSISTENT_IDS = 'fcm_persistent_ids';

class FCMDataStore {
    static getCredentials() {
        return ElectronStore.get(KEY_FCM_CREDENTIALS);
    }

    static setCredentials(fcmCredentials) {
        ElectronStore.set(KEY_FCM_CREDENTIALS, fcmCredentials);
    }

    static clearCredentials() {
        ElectronStore.delete(KEY_FCM_CREDENTIALS);
    }

    static getPersistentIds() {
        return ElectronStore.get(KEY_FCM_PERSISTENT_IDS, []);
    }

    static setPersistentIds(persistentIds) {
        ElectronStore.set(KEY_FCM_PERSISTENT_IDS, persistentIds);
    }

    static addPersistentId(persistentId) {
        var persistentIds = this.getPersistentIds();

        if (!persistentIds.includes(persistentId)) {
            persistentIds.push(persistentId);
            this.setPersistentIds(persistentIds);
        }

        return persistentIds;
    }

    static clearPersistentIds() {
        ElectronStore.delete(KEY_FCM_PERSISTENT_IDS);
    }
}

module.exports = FCMDataStore;