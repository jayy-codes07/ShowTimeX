// Smoke test against a real Redis. Runs in CI (TEST_REDIS_URL points at the
// redis service container) and is skipped locally when the variable is unset.
// Uses its own key prefix so it can never collide with another application's
// keys, or with this app's production keys, on a shared Redis.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../utils/cache');
const { api, startDb, teardown, createMovie } = require('./helpers');

const REDIS_URL = process.env.TEST_REDIS_URL;
const PREFIX = `showtimex-test-${process.pid}:`;

const waitFor = async (predicate, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return predicate();
};

before(async () => {
  await startDb();
  await createMovie({ title: 'Redis Movie' });
  if (REDIS_URL) {
    process.env.CACHE_KEY_PREFIX = PREFIX;
    await cache.connect(REDIS_URL);
    await waitFor(() => cache.getStatus().status === 'ready');
  }
});

after(async () => {
  await cache.close();
  delete process.env.CACHE_KEY_PREFIX;
  await teardown();
});

test('real Redis: MISS, HIT, then MISS after invalidate', { skip: REDIS_URL ? false : 'TEST_REDIS_URL not set' }, async () => {
  assert.deepEqual(cache.getStatus(), { driver: 'redis', status: 'ready' });

  const first = await api().get('/api/movies');
  assert.equal(first.status, 200);
  assert.equal(first.headers['x-cache'], 'MISS');
  // The SET after a miss is fire-and-forget; give it a moment.
  await new Promise((resolve) => setTimeout(resolve, 50));

  const second = await api().get('/api/movies');
  assert.equal(second.headers['x-cache'], 'HIT');
  assert.equal(second.body.movies[0].title, 'Redis Movie');

  await cache.invalidate('movies');
  const third = await api().get('/api/movies');
  assert.equal(third.headers['x-cache'], 'MISS');

  const health = await api().get('/api/health');
  assert.deepEqual(health.body.cache, { driver: 'redis', status: 'ready' });
});
