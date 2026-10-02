// Runs in its own process (node --test spawns one per file), so setting the
// env here before requiring the app configures the limiter for this file only.
process.env.AUTH_RATE_LIMIT_MAX = '2';
process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = '15';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown } = require('./helpers');

before(startDb);
after(teardown);

test('login is rate limited after AUTH_RATE_LIMIT_MAX attempts', async () => {
  const attempt = () =>
    api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password' });

  const first = await attempt();
  const second = await attempt();
  const third = await attempt();

  assert.equal(first.status, 401);
  assert.equal(second.status, 401);
  assert.equal(third.status, 429);
  assert.equal(third.body.success, false);
  assert.ok(third.headers['ratelimit-limit']);
});
