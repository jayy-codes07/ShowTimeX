const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, models: { Movie } } = require('./helpers');

before(startDb);
after(teardown);

test('malformed JSON is a 400 with no stack trace in the body', async () => {
  const res = await api()
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": "x@example.com", ');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.stack, undefined);
});

test('an internal failure returns a generic 500 message without the error text', async () => {
  const original = Movie.find;
  Movie.find = () => {
    throw new Error('secret internal detail');
  };
  try {
    const res = await api().get('/api/movies');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Server error while fetching movies');
    assert.equal(res.body.stack, undefined);
    assert.ok(!JSON.stringify(res.body).includes('secret internal detail'));
  } finally {
    Movie.find = original;
  }
});

test('unknown route returns a 404 JSON body', async () => {
  const res = await api().get('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
