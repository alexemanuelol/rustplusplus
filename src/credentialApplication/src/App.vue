<template>
    <div id="app">
        <!-- Steam is Connected -->
        <template v-if="isRustPlusConnected">
            <div class="min-h-screen bg-gray-200 py-6 flex flex-col justify-center sm:py-12">
                <div class="sm:max-w-xl sm:mx-auto mb-4">
                    <div class="px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-16">
                        <div class="max-w-md mx-auto">

                            <div class="flex mb-4">
                                <img class="mx-auto" src="rustplusplus.png"/>
                            </div>

                            <div class="flex flex-col">
                                <span class="mx-auto text-xl font-bold">rustPlusPlus - FCM Credential Application</span>
                            </div>

                            <div class="divide-y divide-gray-200">
                                <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                    <p>Copy the Slash Command from the text box and run it in a Discord Text Channel.</p>
                                    <textarea ref="textareaCopy" v-on:focus="$event.target.select()" :value="slashCommand" readonly class="w-full h-64 inline-flex items-center border text-sm font-medium rounded-md shadow-sm"></textarea>
                                </div>
                            </div>

                            <button @click="copySlashCommand" type="button" class="w-full inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                                <span class="flex mx-auto">
                                    <span>Copy</span>
                                </span>
                            </button>

                            <button @click="isShowingLogoutModal = true" type="button" class="w-full inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                                <span class="flex mx-auto">
                                    <span>Logout</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Steam not Connected -->
        <ConnectRustPlus v-else @rustplus-connected="onRustPlusConnected($event)"/>

        <!-- Modals -->
        <LogoutModal @close="isShowingLogoutModal = false" @logout="logout" :isShowing="isShowingLogoutModal"/>
  </div>
</template>

<script>
import LogoutModal from "@/components/modals/LogoutModal";
import ConnectRustPlus from '@/components/ConnectRustPlus.vue'

export default {
    name: 'App',
    components: {
        LogoutModal,
        ConnectRustPlus,
    },
    data: function() {
        return {
            appversion: window.appversion,

            slashCommand: null,

            steamId: null,
            rustplusToken: null,

            fcmNotificationReceiver: null,
            expoPushTokenReceiver: null,
            rustCompanionReceiver: null,

            isShowingLogoutModal: false,
        };
    },
    computed: {
        isRustPlusConnected: function () {
            return this.steamId && this.rustplusToken;
        }
    },
    mounted() {
        /* Load rust+ info from store */
        this.steamId = window.DataStore.Config.getSteamId();
        this.rustplusToken = window.DataStore.Config.getRustPlusToken();

        /* Setup fcm, expo and rust companion receivers */
        this.fcmNotificationReceiver = new window.FCMNotificationReceiver(window.ipcRenderer);
        this.expoPushTokenReceiver = new window.ExpoPushTokenReceiver(window.ipcRenderer);
        this.rustCompanionReceiver = new window.RustCompanionReceiver(window.ipcRenderer);

        /* Setup fcm listeners */
        this.fcmNotificationReceiver.on('register.success', this.onFCMRegisterSuccess);
        this.fcmNotificationReceiver.on('register.error', this.onFCMRegisterError);

        /* Setup expo listeners */
        this.expoPushTokenReceiver.on('register.success', this.onExpoRegisterSuccess);
        this.expoPushTokenReceiver.on('register.error', this.onExpoRegisterError);

        /* Setup rust companion listeners */
        this.rustCompanionReceiver.on('register.success', this.onRustCompanionRegisterSuccess);
        this.rustCompanionReceiver.on('register.error', this.onRustCompanionRegisterError);

        /* Setup credentials */
        this.setupCredentials();
    },
    methods: {
        onFCMRegisterSuccess(data) {
            /* Update slashCommand variable */
            this.slashCommand = this.formatSlashCommand(data.credentials);

            /* Save fcm credentials to store */
            window.DataStore.FCM.setCredentials(data.credentials);

            /* Configure expo data */
            this.setupExpo();
        },

        onFCMRegisterError(data) {
            /* Do nothing */
        },

        onExpoRegisterSuccess(data) {
            /* Register with rust companion api if logged into steam */
            if (this.isRustPlusConnected) {
                /**
                 * The Rust Companion API will update the expo token if an existing registration exists for a deviceId.
                 * Rust+ uses the device name as the deviceId, so if a user has two devices with same name, it won't
                 * work. So, we will use a unique deviceId per installation so notifications will work across multiple
                 * installs.
                 */
                let expoDeviceId = window.DataStore.Config.getExpoDeviceId();
                let deviceId = 'rustPlusPlus-FCM-Credential-Application:' + expoDeviceId;
                let rustplusToken = window.DataStore.Config.getRustPlusToken();

                this.rustCompanionReceiver.register(deviceId, rustplusToken, data.expoPushToken);
            }
        },

        onExpoRegisterError(data) {
            /* Do nothing */
        },

        onRustCompanionRegisterSuccess(data) {
            /* Do nothing */
        },

        onRustCompanionRegisterError(data) {
            /* Check if rustplus token needs to be refreshed */
            if (data.response_code === 403) {
                /* Remove cached rustplus token */
                window.DataStore.Config.clearRustPlusToken();

                /* Tell user their rustplus token has expired */
                alert("Your RustPlus token has expired. Please connect with RustPlus again.");

                /* Reload window */
                window.location.reload();
            }
        },

        setupCredentials() {
            /* Check for existing fcm credentials */
            let credentials = window.DataStore.FCM.getCredentials();
            if (credentials) {
                /* Populate slashCommand with the Discord Slash Command */
                this.slashCommand = this.formatSlashCommand(credentials);

                /* Clear saved persistent ids */
                window.DataStore.FCM.clearPersistentIds();

                /* Configure expo data */
                this.setupExpo();
            }
            else {
                /* Register for a new set of fcm credentials */
                this.fcmNotificationReceiver.register('976529667804');
            }
        },

        setupExpo() {
            var deviceId = window.DataStore.Config.getExpoDeviceId();
            var experienceId = '@facepunch/RustCompanion';
            var appId = 'com.facepunch.rust.companion';
            var fcmToken = window.DataStore.FCM.getCredentials().fcm.token;

            this.expoPushTokenReceiver.register(deviceId, experienceId, appId, fcmToken);
        },

        logout() {
            /* Close logout modal */
            this.isShowingLogoutModal = false;

            /* Forget steam account */
            window.DataStore.Config.clearSteamId();
            window.DataStore.Config.clearRustPlusToken();

            /* Clear in memory state, which will force user to connect steam */
            this.steamId = null;
            this.rustplusToken = null;

            /* Clear FCM Credentials */
            window.DataStore.FCM.clearCredentials();
            this.slashCommand = null;
        },

        onRustPlusConnected(event) {
            /* Save rust+ info to store */
            window.DataStore.Config.setSteamId(event.steamId);
            window.DataStore.Config.setRustPlusToken(event.token);

            /* Update steam id and token in memory */
            this.steamId = event.steamId;
            this.rustplusToken = event.token;

            /* Setup credentials */
            this.setupCredentials();
        },

        formatSlashCommand(credentials) {
            if (!credentials) return false;

            return '/credentials set ' +
                `keys_private_key: ${credentials.keys.privateKey} ` +
                `keys_public_key: ${credentials.keys.publicKey} ` +
                `keys_auth_secret: ${credentials.keys.authSecret} ` +
                `fcm_token: ${credentials.fcm.token} ` +
                `fcm_push_set: ${credentials.fcm.pushSet} ` +
                `gcm_token: ${credentials.gcm.token} ` +
                `gcm_android_id: ${credentials.gcm.androidId} ` +
                `gcm_security_token: ${credentials.gcm.securityToken} ` +
                `gcm_app_id: ${credentials.gcm.appId}`;
        },

        copySlashCommand() {
            this.$refs.textareaCopy.focus();
            document.execCommand('copy');
        }
    }
}
</script>
