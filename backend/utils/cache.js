// Optional read-through cache for the public movie and show list endpoints.
//
// - With no REDIS_URL (or when Redis is unreachable) every request is served
//   from MongoDB and responses carry `X-Cache: BYPASS`. Exactly one warning is
//   logged per process.
// - Keys are versioned: `<prefix><group>:<version>:<originalUrl>`. Invalidation
//   increments `<prefix>ver:<group>`, so stale entries are simply never read
//   again and expire by TTL. No SCAN, no FLUSH, so a shared Redis is safe.
// - `disableOfflineQueue` is required: without it commands queue while Redis
//   is down and HTTP requests hang instead of falling through to MongoDB.
const logger = require('./logger');

const COMMAND_TIMEOUT_MS = 250;
const DEFAULT_TTL = { movies: 300, shows: 30 };

let client = null;
let store = null; // { get(key), set(key, value, ttlSeconds), incr(key) }
let driver = 'none';
let status = 'disabled';
let warned = false;

const keyPrefix = () => process.env.CACHE_KEY_PREFIX || 'showtimex:';

const ttlFor = (group) => {
  const specific =
    group === 'movies'
      ? process.env.CACHE_TTL_MOVIES_SECONDS
      : group === 'shows'
        ? process.env.CACHE_TTL_SHOWS_SECONDS
        : undefined;
  const value = parseInt(specific || process.env.CACHE_TTL_SECONDS, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TTL[group] || 30;
};

const warnOnce = (message) => {
  if (warned) return;
  warned = true;
  logger.warn(message);
};

const isReady = () => {
  if (driver === 'memory') return Boolean(store);
  return Boolean(client && client.isReady) && status === 'ready';
};

const getStatus = () => ({ driver, status });

const withTimeout = (promise) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('cache command timed out')), COMMAND_TIMEOUT_MS);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });

const redisStore = (redisClient) => ({
  get: (key) => redisClient.get(key),
  set: (key, value, ttlSeconds) => redisClient.set(key, value, { EX: ttlSeconds }),
  incr: (key) => redisClient.incr(key),
});

// Test hook: swap in any store implementing get/set/incr.
const useStore = (nextStore) => {
  store = nextStore;
  client = null;
  driver = nextStore ? 'memory' : 'none';
  status = nextStore ? 'ready' : 'disabled';
};

// Returns immediately; connection failures are reported through status/logs.
const connect = async (url = process.env.REDIS_URL) => {
  if (client) return;
  if (!url) {
    driver = 'none';
    status = 'disabled';
    warnOnce('Cache disabled: REDIS_URL is not set; serving from MongoDB');
    return;
  }

  const { createClient } = require('redis');
  const connectTimeout = parseInt(process.env.CACHE_CONNECT_TIMEOUT_MS, 10) || 2000;

  driver = 'redis';
  status = 'connecting';
  client = createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout,
      reconnectStrategy: (retries) => Math.min(retries * 500, 30000),
    },
  });
  store = redisStore(client);

  client.on('error', (error) => {
    status = 'unavailable';
    warnOnce(`Cache unavailable, serving from MongoDB: ${error.message}`);
  });
  client.on('ready', () => {
    status = 'ready';
    logger.info('Redis cache connected');
  });

  // Not awaited: with a retrying reconnectStrategy, node-redis keeps the
  // connect() promise pending until it eventually succeeds, which would stall
  // boot (and tests) while Redis is down. Status is tracked via the events.
  client.connect().catch(() => {
    // The error event above already warned; reconnectStrategy keeps retrying.
  });
};

const close = async () => {
  if (client) {
    const current = client;
    client = null;
    try {
      if (current.isOpen && current.isReady) {
        await current.quit();
      } else {
        current.destroy ? current.destroy() : current.disconnect();
      }
    } catch (error) {
      try { current.destroy ? current.destroy() : current.disconnect(); } catch (_) { /* already closed */ }
    }
  }
  store = null;
  driver = 'none';
  status = 'disabled';
};

const versionKey = (group) => `${keyPrefix()}ver:${group}`;

const readVersion = async (group) => {
  const value = await withTimeout(store.get(versionKey(group)));
  return value || '0';
};

// Bump the version counter of each group. Never throws.
const invalidate = async (...groups) => {
  if (!isReady()) return;
  await Promise.all(
    groups.map((group) =>
      withTimeout(store.incr(versionKey(group))).catch((error) => {
        logger.error(`Cache invalidate failed for ${group}:`, error.message);
      })
    )
  );
};

const cacheMiddleware = (group, { bypassWhenAuthorized = false } = {}) =>
  async (req, res, next) => {
    if (!isReady() || (bypassWhenAuthorized && req.headers.authorization)) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    let key;
    try {
      const version = await readVersion(group);
      key = `${keyPrefix()}${group}:${version}:${req.originalUrl}`;
      const hit = await withTimeout(store.get(key));
      if (hit) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(hit));
      }
    } catch (error) {
      // Treat any cache failure as a miss; MongoDB answers below.
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        withTimeout(store.set(key, JSON.stringify(body), ttlFor(group))).catch(() => {});
      }
      return originalJson(body);
    };
    return next();
  };

module.exports = {
  connect,
  close,
  useStore,
  isReady,
  getStatus,
  invalidate,
  cacheMiddleware,
  ttlFor,
};
