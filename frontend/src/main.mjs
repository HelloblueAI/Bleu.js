import { createApp } from 'vue';
import App from './App.vue';
import router from './router.mjs';
import store from './store/index.mjs';
import './assets/styles/global.css';

const app = createApp(App);

app.use(router);
app.use(store);

app.mount('#app');
