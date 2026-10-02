const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { api, startDb, teardown, models: { User } } = require('./helpers');

before(startDb);
after(teardown);

const creds = { name: 'Auth Tester', email: 'auth.tester@example.com', phone: '9123456789', password: 'Password1' };

test('register returns a token, forces the customer role and never echoes the password hash', async () => {
  const res = await api().post('/api/auth/register').send({ ...creds, role: 'admin' });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, 'customer');
  assert.equal(res.body.user.password, undefined);

  const stored = await User.findOne({ email: creds.email }).select('+password');
  assert.notEqual(stored.password, creds.password);
  assert.equal(stored.role, 'customer');
});

test('register validates input and rejects duplicate emails', async () => {
  const short = await api().post('/api/auth/register').send({ ...creds, email: 'x@example.com', password: 'short' });
  assert.equal(short.status, 400);

  const dup = await api().post('/api/auth/register').send(creds);
  assert.equal(dup.status, 400);
});

test('login succeeds with the right password and fails with the wrong one', async () => {
  const ok = await api().post('/api/auth/login').send({ email: creds.email, password: creds.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await api().post('/api/auth/login').send({ email: creds.email, password: 'Wrong1234' });
  assert.equal(bad.status, 401);
});

test('protected route rejects missing, malformed and forged tokens', async () => {
  const none = await api().get('/api/auth/profile');
  assert.equal(none.status, 401);

  const garbage = await api().get('/api/auth/profile').set('Authorization', 'Bearer not-a-jwt');
  assert.equal(garbage.status, 401);

  const jwt = require('jsonwebtoken');
  const forged = jwt.sign({ id: '000000000000000000000000' }, 'some-other-secret');
  const res = await api().get('/api/auth/profile').set('Authorization', `Bearer ${forged}`);
  assert.equal(res.status, 401);
});

test('profile returns the logged-in user without sensitive fields', async () => {
  const login = await api().post('/api/auth/login').send({ email: creds.email, password: creds.password });
  const res = await api().get('/api/auth/profile').set('Authorization', `Bearer ${login.body.token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, creds.email);
  assert.equal(res.body.user.password, undefined);
  assert.equal(res.body.user.resetPasswordOTP, undefined);
});
