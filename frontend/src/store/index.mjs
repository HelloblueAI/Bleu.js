import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      message: 'Hello, Vuex!'
    };
  },
  mutations: {
    setMessage(state, newMessage) {
      state.message = newMessage;
    }
  },
  actions: {
    updateMessage({ commit }, newMessage) {
      commit('setMessage', newMessage);
    }
  },
  getters: {
    message(state) {
      return state.message;
    }
  }
});

export default store;