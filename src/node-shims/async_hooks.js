export class AsyncLocalStorage {
        run(store, callback) { return callback(); }
        getStore() { return null; }
      }
      export const createHook = () => ({ enable: () => {}, disable: () => {} });