class Store {
  constructor(options) {
    this.state = new Proxy(options.state, {
      set: (target, key, value) => {
        target[key] = value;
        return true;
      }
    });
    this.mutations = options.mutations;
    this.actions = options.actions;
  }

  commit(mutation, payload) {
    this.mutations[mutation](this.state, payload);
  }

  dispatch(action, payload) {
    return this.actions[action]({
      commit: this.commit.bind(this),
      state: this.state
    }, payload);
  }
}

const BleuX = {
  install(Bleu) {
    Bleu.prototype.$store = null;
    Bleu.mixin({
      beforeCreate() {
        if (this.$options.store) {
          Bleu.prototype.$store = this.$options.store;
        }
      }
    });
  }
};

export { Store };
export default BleuX;
