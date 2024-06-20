import { createStore } from 'vuex';

export default createStore({
  state: {
    message: 'Welcome to Bleu.js',
  },
  mutations: {
    updateMessage(state, newMessage) {
      state.message = newMessage;
    },
  },
  actions: {
    updateMessage({ commit }, newMessage) {
      commit('updateMessage', newMessage);
    },
  },
  modules: {},
});
