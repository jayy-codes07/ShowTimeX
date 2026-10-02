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

test('middleware falls through with X-Cache: BYPASS while Redis is down', async () => {
  const headers = {};
  const req = { headers: {}, originalUrl: '/api/movies' };
  const res = { set: (k, v) => { headers[k] = v; }, statusCode: 200, json: () => {} };
  let called = false;
  await cache.cacheMiddleware('movies')(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(headers['X-Cache'], 'BYPASS');
  // Reconnect attempts in the background must not add warnings.
  assert.equal(warnings.length, 1);
});
