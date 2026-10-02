// In-memory stand-in for the Redis store used by utils/cache.js, so cache
// behaviour is tested without a network. Records every set() so tests can
// assert on keys and TTLs.
const createMemoryCacheStore = () => {
  const entries = new Map(); // key -> { value, expiresAt }
  const sets = []; // { key, value, ttlSeconds }

  const live = (key) => {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }
    return entry;
  };

  return {
    async get(key) {
      const entry = live(key);
      return entry ? entry.value : null;
    },
    async set(key, value, ttlSeconds) {
      sets.push({ key, value, ttlSeconds });
      entries.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
      return 'OK';
    },
    async incr(key) {
      const entry = live(key);
      const next = (entry ? parseInt(entry.value, 10) || 0 : 0) + 1;
      entries.set(key, { value: String(next), expiresAt: null });
      return next;
    },
    // Test helpers
    keys: () => Array.from(entries.keys()),
    sets,
  };
};

module.exports = { createMemoryCacheStore };
