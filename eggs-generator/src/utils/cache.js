const cache = {
  get: async (key) => null, // Simulate cache miss
  set: async (key, value, ttl) => {}, // Simulate storing value
  clear: async () => {}, // Simulate clearing cache
};

export default cache;
