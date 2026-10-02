const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { api, startDb, teardown, createMovie } = require('./helpers');

// Count warnings instead of printing them (logger.warn is silent under test anyway).
const warnings = [];
const originalWarn = logger.warn;
logger.warn = (...args) => { warnings.push(args.join(' ')); };

const waitFor = async (predicate, timeoutMs = 3000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return predicate();
};

before(async () => {
  await startDb();
  await createMovie({ title: 'Fallback Movie' });
  process.env.CACHE_CONNECT_TIMEOUT_MS = '300';
  // Nothing listens on port 1; the connection is refused immediately.
  await cache.connect('redis://127.0.0.1:1');
});

after(async () => {
  await cache.close();
  logger.warn = originalWarn;
  delete process.env.CACHE_CONNECT_TIMEOUT_MS;
  await teardown();
});

test('unreachable Redis is reported as unavailable with exactly one warning', async () => {
  assert.equal(await waitFor(() => cache.getStatus().status === 'unavailable'), true);
  assert.equal(cache.getStatus().driver, 'redis');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Cache unavailable, serving from MongoDB/);
});

test('requests are served from MongoDB with X-Cache: BYPASS while Redis is down', async () => {
  const first = await api().get('/api/movies');
  const second = await api().get('/api/movies');
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.headers['x-cache'], 'BYPASS');
  assert.equal(second.headers['x-cache'], 'BYPASS');
  assert.equal(first.body.movies[0].title, 'Fallback Movie');
  // Reconnect attempts in the background must not add warnings.
  assert.equal(warnings.length, 1);
});

test('/api/health reports the redis driver as unavailable', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.cache, { driver: 'redis', status: 'unavailable' });
});
