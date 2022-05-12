<template>
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
                            <p>Register fcm credentials</p>
                        </div>
                    </div>

                    <button @click="connectWithRustPlus" type="button" class="w-full inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                        <span class="flex mx-auto">
                            <span>Connect with Rust+</span>
                        </span>
                    </button>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ConnectRustPlus',
    data() {
        return { version: window.appversion };
    },
    mounted: async function () {
        /* Handle rust+ login callback */
        window.ipcRenderer.on('connect-with-rustplus.success', (event, data) => {
            this.onRustPlusConnected(data.steamId, data.token);
        });
    },
    methods: {
        connectWithRustPlus: function() {
            window.ipcRenderer.send('connect-with-rustplus');
        },

        onRustPlusConnected(id, token) {
            this.$emit('rustplus-connected', {
                steamId: id,
                token: token,
            });
        }
    }
}
</script>
