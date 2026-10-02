const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, createMovie } = require('./helpers');

before(startDb);
after(teardown);

test('GET /api/health responds without a database', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('database-backed route works against the in-memory MongoDB', async () => {
  await createMovie({ title: 'Harness Movie' });
  const res = await api().get('/api/movies');
  assert.equal(res.status, 200);
  assert.equal(res.body.count, 1);
  assert.equal(res.body.movies[0].title, 'Harness Movie');
});

test('test environment never carries a real MONGO_URI', () => {
  assert.equal(process.env.MONGO_URI, undefined);
  assert.equal(process.env.NODE_ENV, 'test');
});
