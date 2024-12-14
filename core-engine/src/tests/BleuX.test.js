const { Store, BleuX } = require('@core-engine/BleuX');

describe('BleuX Store', () => {
  let store;

  beforeEach(() => {
    store = new Store({
      state: { count: 0 },
      mutations: {
        increment(state, payload) {
          state.count += payload;
        },
        decrement(state, payload) {
          state.count -= payload;
        },
      },
      actions: {
        incrementAsync({ commit }, payload) {
          return new Promise((resolve) => {
            setTimeout(() => {
              commit('increment', payload);
              resolve();
            }, 100);
          });
        },
      },
    });
  });

  it('should commit a mutation and update state', () => {
    store.commit('increment', 5);
    expect(store.state.count).toBe(5);

    store.commit('decrement', 2);
    expect(store.state.count).toBe(3);
  });

  it('should dispatch an action and update state asynchronously', async () => {
    await store.dispatch('incrementAsync', 3);
    expect(store.state.count).toBe(3);
  });

  it('should log an error for non-existing mutation', () => {
    const spy = jest.spyOn(console, 'error');
    store.commit('nonExistingMutation', {});
    expect(spy).toHaveBeenCalledWith(
      'Mutation nonExistingMutation does not exist',
    );
    spy.mockRestore();
  });

  it('should log an error for non-existing action', () => {
    const spy = jest.spyOn(console, 'error');
    store.dispatch('nonExistingAction', {});
    expect(spy).toHaveBeenCalledWith('Action nonExistingAction does not exist');
    spy.mockRestore();
  });
});

describe('BleuX Plugin', () => {
  it('should install the plugin and attach store to Bleu instance', () => {
    const mockBleu = jest.fn();
    const store = { state: { count: 0 } };

    BleuX.install(mockBleu);
    const instance = { $options: { store } };
    mockBleu.prototype.$store = null;

    expect(mockBleu.prototype.$store).toBeNull();
    mockBleu.mixin.mock.calls[0][0].beforeCreate.call(instance);

    expect(mockBleu.prototype.$store).toBe(store);
  });
});
