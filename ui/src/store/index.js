import Bleu from '../../../core-engine/src/Bleu.js';
import { Store } from '../../../core-engine/src/BleuX.js';

Bleu.use({
  install(Bleu) {
    Bleu.prototype.$store = new Store({
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
  }
});

export default Bleu.prototype.$store;
