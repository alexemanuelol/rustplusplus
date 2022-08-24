import App from '@/App.vue'
import Vue from 'vue'

/* Add globals */
window.ExpoPushTokenReceiver = require('@/js/ipc/renderer/ExpoPushTokenReceiver');
window.FCMNotificationReceiver = require('@/js/ipc/renderer/FCMNotificationReceiver');
window.RustCompanionReceiver = require('@/js/ipc/renderer/RustCompanionReceiver');

/* Configure vue */
Vue.config.productionTip = false;

/* Import stylesheets */
import '@/assets/tailwind.css'

/* Add vue cookie */
Vue.use(require('vue-cookie'));

/* Render vue app */
new Vue({ render: h => h(App) }).$mount('#app');
