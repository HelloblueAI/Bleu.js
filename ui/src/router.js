import Vue from 'vue';
import Router from 'vue-router';
import Home from './App.vue'; // Ensure App.vue is the correct component

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    // Add more routes as needed
  ],
});
