const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, createUser, tokenFor, createMovie, createShow } = require('./helpers');

let adminToken;

before(async () => {
  await startDb();
  const admin = await createUser({ role: 'admin' });
  adminToken = tokenFor(admin);
  const movie = await createMovie({ title: 'Regex (Safe) Movie', description: 'brackets [ok]' });
  await createShow(movie, { theater: 'Cine (Plaza)' });
});
after(teardown);

test('movie search with regex metacharacters returns 200 and matches literally', async () => {
  const broken = await api().get('/api/movies/search').query({ query: '(' });
  assert.equal(broken.status, 200);
  assert.equal(broken.body.count, 1);

  const literal = await api().get('/api/movies/search').query({ query: '(Safe)' });
  assert.equal(literal.status, 200);
  assert.equal(literal.body.count, 1);

  const noMatch = await api().get('/api/movies/search').query({ query: '.*zzz' });
  assert.equal(noMatch.status, 200);
  assert.equal(noMatch.body.count, 0);
});

test('show theater filter with regex metacharacters returns 200', async () => {
  const res = await api().get('/api/shows').query({ theater: '[' });
  assert.equal(res.status, 200);
  const match = await api().get('/api/shows').query({ theater: '(Plaza)' });
  assert.equal(match.status, 200);
  assert.equal(match.body.count, 1);
});

test('admin booking search and theater filter accept regex metacharacters', async () => {
  const res = await api()
    .get('/api/admin/bookings')
    .set('Authorization', `Bearer ${adminToken}`)
    .query({ search: '(', theater: '[' });
  assert.equal(res.status, 200);
});

test('CORS: allowed origin gets the header, unknown origin does not', async () => {
  const allowed = await api().get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');

  const denied = await api().get('/api/health').set('Origin', 'http://evil.example');
  assert.equal(denied.status, 200);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('helmet security headers are present', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-powered-by'], undefined);
});
