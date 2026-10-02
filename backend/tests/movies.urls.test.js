const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, createUser, tokenFor } = require('./helpers');

let adminToken;

before(async () => {
  await startDb();
  const admin = await createUser({ role: 'admin' });
  adminToken = tokenFor(admin);
});
after(teardown);

const baseMovie = (extra = {}) => ({
  title: `Url Movie ${Math.random().toString(16).slice(2)}`,
  description: 'desc',
  genres: ['Drama'],
  languages: ['English'],
  duration: 100,
  releaseDate: '2020-01-01',
  ...extra,
});

test('admin creates a movie with a poster URL (JSON, no multipart)', async () => {
  const res = await api()
    .post('/api/movies')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(baseMovie({ poster: 'https://image.tmdb.org/t/p/w500/x.jpg' }));
  assert.equal(res.status, 201);
  assert.equal(res.body.movie.poster, 'https://image.tmdb.org/t/p/w500/x.jpg');
});

test('non-URL poster is rejected with 400', async () => {
  const res = await api()
    .post('/api/movies')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(baseMovie({ poster: '/uploads/undefined' }));
  assert.equal(res.status, 400);
  assert.match(res.body.message, /poster must be an http\(s\) URL/);
});

test('GET /uploads is no longer served', async () => {
  const res = await api().get('/uploads/anything.png');
  assert.equal(res.status, 404);
});
