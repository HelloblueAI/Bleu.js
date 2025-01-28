class Store {
  constructor(options) {
    this.state = new Proxy(options.state, {
      set: (target, key, value) => {
        target[key] = value;
        return true;
      },
    });
    this.mutations = options.mutations;
    this.actions = options.actions;
  }

  commit(mutation, payload) {
    if (this.mutations[mutation]) {
      this.mutations[mutation](this.state, payload);
    } else {
      console.error(`Mutation ${mutation} does not exist`);
    }
  }

  dispatch(action, payload) {
    if (this.actions[action]) {
      return this.actions[action](
        {
          commit: this.commit.bind(this),
          state: this.state,
        },
        payload,
      );
    } else {
      console.error(`Action ${action} does not exist`);
      return null;
    }
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
      },
    });
  },
};

export { Store, BleuX };
