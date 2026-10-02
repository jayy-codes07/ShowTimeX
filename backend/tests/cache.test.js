const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../utils/cache');
const { createMemoryCacheStore } = require('./memoryCacheStore');
const {
  api,
  startDb,
  teardown,
  createUser,
  tokenFor,
  createMovie,
  createShow,
} = require('./helpers');

let store;
let admin;
let adminToken;
let userA;
let tokenA;
let movie;
let show;

before(async () => {
  await startDb();
  store = createMemoryCacheStore();
  cache.useStore(store);
  admin = await createUser({ role: 'admin' });
  adminToken = tokenFor(admin);
  userA = await createUser();
  tokenA = tokenFor(userA);
  movie = await createMovie({ title: 'Cached Movie' });
  show = await createShow(movie);
});

after(async () => {
  await cache.close();
  await teardown();
});

test('GET /api/movies: MISS then HIT with an identical body', async () => {
  const first = await api().get('/api/movies');
  const second = await api().get('/api/movies');
  assert.equal(first.status, 200);
  assert.equal(first.headers['x-cache'], 'MISS');
  assert.equal(second.status, 200);
  assert.equal(second.headers['x-cache'], 'HIT');
  assert.deepEqual(second.body, first.body);
});

test('movie lists use the longer movie TTL, show lists the shorter one', async () => {
  const movieSet = store.sets.find((s) => s.key.includes(':movies:'));
  assert.ok(movieSet, 'a movies entry was written');
  assert.equal(movieSet.ttlSeconds, 300);

  const res = await api().get(`/api/shows/movie/${movie._id}`);
  assert.equal(res.headers['x-cache'], 'MISS');
  const showSet = store.sets.find((s) => s.key.includes(':shows:'));
  assert.ok(showSet, 'a shows entry was written');
  assert.equal(showSet.ttlSeconds, 30);

  // Explicit env values win over the defaults; the generic fallback applies to both.
  process.env.CACHE_TTL_MOVIES_SECONDS = '120';
  process.env.CACHE_TTL_SHOWS_SECONDS = '7';
  assert.equal(cache.ttlFor('movies'), 120);
  assert.equal(cache.ttlFor('shows'), 7);
  delete process.env.CACHE_TTL_MOVIES_SECONDS;
  delete process.env.CACHE_TTL_SHOWS_SECONDS;
  process.env.CACHE_TTL_SECONDS = '45';
  assert.equal(cache.ttlFor('movies'), 45);
  assert.equal(cache.ttlFor('shows'), 45);
  delete process.env.CACHE_TTL_SECONDS;
  assert.equal(cache.ttlFor('movies'), 300);
  assert.equal(cache.ttlFor('shows'), 30);
});

test('an admin movie write invalidates the movie lists', async () => {
  const warm = await api().get('/api/movies');
  assert.equal(warm.headers['x-cache'], 'HIT');

  const created = await api()
    .post('/api/movies')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Brand New Movie',
      description: 'desc',
      genres: ['Drama'],
      languages: ['English'],
      duration: 100,
      releaseDate: '2020-01-01',
    });
  assert.equal(created.status, 201);

  const after = await api().get('/api/movies');
  assert.equal(after.headers['x-cache'], 'MISS');
  assert.ok(after.body.movies.some((m) => m.title === 'Brand New Movie'));
});

test('a seat lock invalidates the anonymous show lists', async () => {
  const url = `/api/shows/movie/${movie._id}`;
  await api().get(url);
  const warm = await api().get(url);
  assert.equal(warm.headers['x-cache'], 'HIT');
  assert.equal(warm.body.shows[0].lockedSeats.length, 0);

  const lock = await api()
    .post(`/api/shows/${show._id}/lock`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ seats: [{ row: 'A', number: 1 }] });
  assert.equal(lock.status, 200);

  const fresh = await api().get(url);
  assert.equal(fresh.headers['x-cache'], 'MISS');
  assert.equal(fresh.body.shows[0].lockedSeats.length, 1);
});

test('no cross-user data: authorized show lists bypass, cached bodies carry no myLockedSeats', async () => {
  const url = `/api/shows/movie/${movie._id}`;

  const mine = await api().get(url).set('Authorization', `Bearer ${tokenA}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.headers['x-cache'], 'BYPASS');
  assert.deepEqual(mine.body.shows[0].myLockedSeats, [{ row: 'A', number: 1 }]);

  const anon = await api().get(url);
  assert.equal(anon.headers['x-cache'], 'HIT');
  assert.equal('myLockedSeats' in anon.body.shows[0], false);
  assert.equal('myLockExpiresAt' in anon.body.shows[0], false);

  // Older versions stay in the store until their TTL expires; only the current
  // version is ever read.
  const version = await store.get('showtimex:ver:shows');
  const showKeys = store.keys().filter((k) => k.startsWith(`showtimex:shows:${version}:`) && k.includes(url));
  assert.equal(showKeys.length, 1, 'exactly one cached entry for this list at the current version');
  const cached = JSON.parse(await store.get(showKeys[0]));
  assert.equal(JSON.stringify(cached).includes('myLockedSeats'), false);
});

test('GET /api/shows/:id is never cached and still returns the caller lock', async () => {
  const res = await api().get(`/api/shows/${show._id}`).set('Authorization', `Bearer ${tokenA}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers['x-cache'], undefined);
  assert.deepEqual(res.body.show.myLockedSeats, [{ row: 'A', number: 1 }]);
  assert.equal(store.keys().some((k) => k.includes(`/api/shows/${show._id}`)), false);
});

test('/api/health reports the active cache driver', async () => {
  const res = await api().get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.cache, { driver: 'memory', status: 'ready' });
});
