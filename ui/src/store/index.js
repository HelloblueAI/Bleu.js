import Bleu from '../../../core-engine/src/Bleu.js';
import BleuX from '../../../core-engine/src/BleuX.js';

Bleu.use(BleuX);

export default new BleuX.Store({
  state: {
    message: 'Welcome to Bleu.js'
  },
  mutations: {
    updateMessage(state, newMessage) {
      state.message = newMessage;
    }
  },
  actions: {
    updateMessage({ commit }, newMessage) {
      commit('updateMessage', newMessage);
    }
  }
});
