//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
class Store {
  constructor(options = {}) {
    this._state = this._createReactiveState(options.state || {});
    this._mutations = options.mutations || {};
    this._actions = options.actions || {};
    this._subscribers = new Set();
    this._watchers = new Map();
    this._modules = new Map();
    this._isCommitting = false;
    this._gettersCache = {};
    this._strict = options.strict || false;

    if (options.modules) {
      Object.entries(options.modules).forEach(([name, moduleOptions]) => {
        this.registerModule(name, moduleOptions);
      });
    }

    if (options.plugins) {
      options.plugins.forEach((plugin) => plugin(this));
    }
  }

  _createReactiveState(state) {
    const store = this;

    return new Proxy(state, {
      get(target, key) {
        const value = target[key];
        return value && typeof value === 'object'
          ? store._createReactiveState(value)
          : value;
      },

      set(target, key, value) {
        if (store._strict && !store._isCommitting) {
          throw new Error(
            'State mutation outside of mutation handler is not allowed in strict mode',
          );
        }

        const oldValue = target[key];
        target[key] = value;

        const watcherCallbacks = store._watchers.get(key);
        if (watcherCallbacks) {
          watcherCallbacks.forEach((callback) => callback(value, oldValue));
        }

        return true;
      },
    });
  }

  commit(mutation, payload) {
    const mutationHandler = this._mutations[mutation];

    if (!mutationHandler) {
      throw new Error(`Unknown mutation type: ${mutation}`);
    }

    try {
      this._isCommitting = true;
      mutationHandler(this._state, payload);

      this._subscribers.forEach((subscriber) =>
        subscriber(mutation, this._state),
      );
    } finally {
      this._isCommitting = false;
    }
  }

  async dispatch(action, payload) {
    const actionHandler = this._actions[action];

    if (!actionHandler) {
      throw new Error(`Unknown action type: ${action}`);
    }

    const context = {
      commit: this.commit.bind(this),
      dispatch: this.dispatch.bind(this),
      state: this._state,
      rootState: this._state,
      getters: this._gettersCache,
    };

    try {
      const result = await actionHandler(context, payload);
      return result;
    } catch (error) {
      console.error(`Error in action ${action}:`, error);
      throw error;
    }
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  watch(key, callback) {
    if (!this._watchers.has(key)) {
      this._watchers.set(key, new Set());
    }

    const callbacks = this._watchers.get(key);
    callbacks.add(callback);

    return () => callbacks.delete(callback);
  }

  registerModule(name, options = {}) {
    const moduleStore = new Store({
      ...options,
      strict: this._strict,
    });

    this._modules.set(name, moduleStore);
    this._state[name] = moduleStore._state;
  }

  unregisterModule(name) {
    if (!this._modules.has(name)) {
      return;
    }

    this._modules.delete(name);
    delete this._state[name];
  }

  hotUpdate(newOptions) {
    this._mutations = newOptions.mutations || this._mutations;
    this._actions = newOptions.actions || this._actions;

    if (newOptions.modules) {
      Object.entries(newOptions.modules).forEach(([name, moduleOptions]) => {
        if (this._modules.has(name)) {
          this._modules.get(name).hotUpdate(moduleOptions);
        } else {
          this.registerModule(name, moduleOptions);
        }
      });
    }
  }

  snapshot() {
    return {
      state: JSON.parse(JSON.stringify(this._state)),
      timestamp: Date.now(),
    };
  }

  restore(snapshot) {
    Object.keys(this._state).forEach((key) => {
      this._state[key] = snapshot.state[key];
    });
  }
}

const BleuX = {
  install(Bleu, options = {}) {
    if (!options.store) {
      throw new Error('BleuX installation requires a store option');
    }

    const store = options.store;

    Bleu.prototype.$store = store;

    Bleu.provide('store', store);

    Bleu.mixin({
      beforeCreate() {
        if (this.$options.store) {
          Bleu.prototype.$store = this.$options.store;
        }
      },
    });
  },
};

export { BleuX, Store };
