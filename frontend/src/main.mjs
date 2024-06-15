import { createApp } from 'vue';
import App from './App.vue';
import router from './router.mjs';
import store from './store/index.mjs';
import './assets/styles/global.css';

createApp(App)
  .use(router)
  .use(store)
  .mount('#app');
