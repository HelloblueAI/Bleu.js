const cache = new Map();

export default {
  get: async (key) => cache.get(key),
  set: async (key, value, ttl = 3600) => {
    cache.set(key, value);
    setTimeout(() => cache.delete(key), ttl * 1000);
  },
  clear: async () => {
    cache.clear();
  },
};
