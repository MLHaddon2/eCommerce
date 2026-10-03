// API tests: auth, admin guard, cart ownership, reviews.
// Run with `npm test`. Uses an in-memory SQLite database (see config/Database.js),
// so no MySQL server or real .env secrets are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClient, registerUser, makeAdmin, Product, Users, Customers } from './helpers.js';

/* ── Auth ──────────────────────────────────────────────────────────────── */

test('register sets auth cookies, creates a customer profile, and is never admin', async () => {
  const client = makeClient();
  const creds = await registerUser(client, { username: 'Admin' });

  assert.ok(client.jar.has('access_token'));
  assert.ok(client.jar.has('refreshToken'));

  const me = await client.get('/api/verify-token');
  assert.equal(me.status, 200);
  assert.equal(me.data.user.username, 'Admin');
  assert.equal(me.data.user.isAdmin, false, 'being named Admin must not grant admin');

  const profile = await client.get('/api/me/customer');
  assert.equal(profile.status, 200);
  assert.equal(profile.data.customer.email, creds.email);
});

test('login rejects a wrong password without revealing whether the user exists', async () => {
  const client = makeClient();
  const creds = await registerUser(client);

  const wrongPw = await makeClient().post('/api/login', { username: creds.username, password: 'nope' });
  const noUser = await makeClient().post('/api/login', { username: 'ghost', password: 'nope' });

  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPw.data.message, noUser.data.message);
});

test('refresh issues a new access cookie from the refresh cookie', async () => {
  const client = makeClient();
  await registerUser(client);
  client.jar.delete('access_token'); // simulate the 15-minute cookie expiring

  assert.equal((await client.get('/api/verify-token')).status, 401);

  const refreshed = await client.get('/api/token');
  assert.equal(refreshed.status, 200);
  assert.ok(client.jar.has('access_token'));
  assert.equal((await client.get('/api/verify-token')).status, 200);
});

test('logout clears the session', async () => {
  const client = makeClient();
  await registerUser(client);
  assert.equal((await client.post('/api/logout')).status, 200);
  assert.equal((await client.get('/api/verify-token')).status, 401);
  assert.equal((await client.get('/api/token')).status, 401);
});

/* ── Admin guard ───────────────────────────────────────────────────────── */

test('admin routes: 401 without login, 403 for customers, 200 for admins', async () => {
  const adminOnly = [
    ['GET', '/api/customers/get'],
    ['GET', '/api/orders/get'],
    ['GET', '/api/transactions/get'],
    ['GET', '/api/ip-history'],
    ['GET', '/api/users']
  ];

  const guest = makeClient();
  const customer = makeClient();
  await registerUser(customer);
  const admin = await makeAdmin();

  for (const [, path] of adminOnly) {
    assert.equal((await guest.get(path)).status, 401, `guest ${path}`);
    assert.equal((await customer.get(path)).status, 403, `customer ${path}`);
    assert.equal((await admin.get(path)).status, 200, `admin ${path}`);
  }
});

test('forged cookies do not grant admin', async () => {
  const client = makeClient();
  await registerUser(client);
  client.jar.set('username', 'Admin');
  client.jar.set('isAuthenticated', 'true');
  assert.equal((await client.get('/api/customers/get')).status, 403);
});

test('the product list is always a 200 array, even when the catalogue is empty', async () => {
  await Product.destroy({ where: {} });
  const res = await makeClient().get('/api/products/getallhistory');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, []);
});

test('only admins can change products, and update responds instead of hanging', async () => {
  const product = await Product.create({
    name: 'Boot', summary: 's', description: 'd', reviews: [], availability: 3, price: 50, category: ['boots']
  });

  const customer = makeClient();
  await registerUser(customer);
  assert.equal((await customer.put(`/api/products/update/${product.id}`, { price: 0.01 })).status, 403);
  assert.equal((await customer.del(`/api/products/delete/${product.id}`)).status, 403);

  const admin = await makeAdmin();
  const res = await admin.put(`/api/products/update/${product.id}`, { price: 45 });
  assert.equal(res.status, 200);
  assert.equal(Number(res.data.product.price), 45);
});

/* ── Cart ──────────────────────────────────────────────────────────────── */

const item = (id, quantity = 1) => ({ id, name: `Item ${id}`, price: 10, quantity });

test('guest cart persists across requests for the same session', async () => {
  const guest = makeClient();
  await guest.get('/api/cart'); // first visit seeds the sessionId cookie
  assert.ok(guest.jar.has('sessionId'));

  assert.equal((await guest.put('/api/cart', { cartItems: [item(1, 2)] })).status, 200);

  const reloaded = await guest.get('/api/cart');
  assert.deepEqual(reloaded.data.cartItems.map((i) => [i.id, i.quantity]), [[1, 2]]);
});

test('guests on different sessions do not share a cart', async () => {
  const a = makeClient();
  const b = makeClient();
  await a.get('/api/cart');
  await b.get('/api/cart');

  await a.put('/api/cart', { cartItems: [item(7)] });
  assert.deepEqual((await b.get('/api/cart')).data.cartItems, []);
});

test('a user cannot read or write another user\'s cart', async () => {
  const alice = makeClient();
  const bob = makeClient();
  await registerUser(alice);
  await registerUser(bob);

  await alice.put('/api/cart', { cartItems: [item(3)] });
  assert.deepEqual((await bob.get('/api/cart')).data.cartItems, []);

  // The old API took the user id from the URL — that route no longer exists.
  assert.equal((await bob.get('/api/cart/get/1/127.0.0.1')).status, 404);
});

test('guest cart is merged into the customer cart at login', async () => {
  const setup = makeClient();
  const creds = await registerUser(setup);
  await setup.put('/api/cart', { cartItems: [item(10)] });

  const browser = makeClient();
  await browser.get('/api/cart');
  await browser.put('/api/cart', { cartItems: [item(11, 2)] });

  await browser.post('/api/login', { username: creds.username, password: creds.password });
  const cart = (await browser.get('/api/cart')).data.cartItems;
  assert.deepEqual(cart.map((i) => [i.id, i.quantity]).sort(), [[10, 1], [11, 2]]);
});

test('cart rejects malformed items', async () => {
  const guest = makeClient();
  await guest.get('/api/cart');
  assert.equal((await guest.put('/api/cart', { cartItems: 'nope' })).status, 400);
  assert.equal((await guest.put('/api/cart', { cartItems: [{ id: 1, quantity: -3 }] })).status, 400);
});

/* ── Reviews ───────────────────────────────────────────────────────────── */

test('reviews require login and take the author from the token', async () => {
  const product = await Product.create({
    name: 'Sandal', summary: 's', description: 'd', reviews: [], availability: 1, price: 20, category: ['sandals']
  });

  const guest = makeClient();
  assert.equal((await guest.post(`/api/products/${product.id}/reviews`, { rating: 5 })).status, 401);

  const client = makeClient();
  const creds = await registerUser(client);
  assert.equal((await client.post(`/api/products/${product.id}/reviews`, { rating: 9 })).status, 400);

  const res = await client.post(`/api/products/${product.id}/reviews`, {
    rating: 4, comment: 'Comfy', username: 'someone-else'
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.review.username, creds.username);
});

/* ── Account security ──────────────────────────────────────────────────── */

test('password change needs the current password and logs out other devices', async () => {
  const laptop = makeClient();
  const creds = await registerUser(laptop);
  const phone = makeClient();
  await phone.post('/api/login', { username: creds.username, password: creds.password });

  const wrong = await laptop.put('/api/me/password', { currentPassword: 'nope', newPassword: 'new password 1' });
  assert.equal(wrong.status, 400);

  const tooShort = await laptop.put('/api/me/password', { currentPassword: creds.password, newPassword: 'short' });
  assert.equal(tooShort.status, 400);

  const ok = await laptop.put('/api/me/password', { currentPassword: creds.password, newPassword: 'new password 1' });
  assert.equal(ok.status, 200);

  // The phone's refresh token was replaced, so it can't renew its session.
  assert.equal((await phone.get('/api/token')).status, 401);
  assert.equal((await laptop.get('/api/token')).status, 200);

  assert.equal((await makeClient().post('/api/login', { username: creds.username, password: creds.password })).status, 401);
  assert.equal((await makeClient().post('/api/login', { username: creds.username, password: 'new password 1' })).status, 200);
});

test('username change updates the session and rejects taken names', async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  const other = makeClient();
  const otherCreds = await registerUser(other);

  const taken = await client.put('/api/me/username', { currentPassword: creds.password, username: otherCreds.username });
  assert.equal(taken.status, 409);

  const newName = `renamed${Date.now()}`;
  const ok = await client.put('/api/me/username', { currentPassword: creds.password, username: newName });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.username, newName);
  assert.equal((await client.get('/api/verify-token')).data.user.username, newName);

  // The customer profile is linked by email, so it's unaffected.
  assert.equal((await client.get('/api/me/customer')).data.customer.email, creds.email);
});

test('register enforces a minimum password length', async () => {
  const res = await makeClient().post('/api/register', {
    username: `short${Date.now()}`, email: `short${Date.now()}@example.com`, password: 'abc', confPwd: 'abc'
  });
  assert.equal(res.status, 400);
});

test('refresh tokens are stored hashed, not in plain text', async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  const user = await Users.findOne({ where: { username: creds.username } });
  assert.notEqual(user.refresh_token, client.jar.get('refreshToken'));
  assert.match(user.refresh_token, /^[a-f0-9]{64}$/);
});

test('session endpoint: null for guests, user when logged in, renews an expired access cookie', async () => {
  const guest = makeClient();
  const anon = await guest.get('/api/session');
  assert.equal(anon.status, 200);
  assert.equal(anon.data.user, null);

  const client = makeClient();
  const creds = await registerUser(client);
  assert.equal((await client.get('/api/session')).data.user.username, creds.username);

  client.jar.delete('access_token'); // access cookie expired
  const renewed = await client.get('/api/session');
  assert.equal(renewed.status, 200);
  assert.equal(renewed.data.user.username, creds.username);
  assert.ok(client.jar.has('access_token'), 'access cookie re-issued');
});

/* ── Review editing / moderation (TODO 1) ─────────────────────────────── */

test('authors can edit and delete their own reviews; others cannot; admins can delete', async () => {
  const product = await Product.create({
    name: 'Clog', summary: 's', description: 'd', reviews: [], availability: 1, price: 30, category: ['clogs']
  });
  const author = makeClient();
  await registerUser(author);
  const stranger = makeClient();
  await registerUser(stranger);
  const admin = await makeAdmin();

  const { review } = (await author.post(`/api/products/${product.id}/reviews`, { rating: 3, comment: 'ok' })).data;
  const url = `/api/products/${product.id}/reviews/${review.id}`;

  assert.equal((await stranger.put(url, { rating: 1, comment: 'hijack' })).status, 403);
  assert.equal((await admin.put(url, { rating: 1, comment: 'admin edit' })).status, 403, 'admins moderate, not rewrite');

  const edited = await author.put(url, { rating: 5, comment: 'grew on me' });
  assert.equal(edited.status, 200);
  const updated = edited.data.reviews.find((r) => r.id === review.id);
  assert.equal(updated.rating, 5);
  assert.ok(updated.editedAt);

  assert.equal((await stranger.del(url)).status, 403);
  const removed = await admin.del(url);
  assert.equal(removed.status, 200);
  assert.equal(removed.data.reviews.length, 0);
  assert.equal((await author.del(url)).status, 404);
});

test('email change updates the login and the customer profile together (TODO 6b)', async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  const other = makeClient();
  const otherCreds = await registerUser(other);

  assert.equal((await client.put('/api/me/email', { currentPassword: 'nope', email: 'x@example.com' })).status, 400);
  assert.equal((await client.put('/api/me/email', { currentPassword: creds.password, email: 'not-an-email' })).status, 400);
  assert.equal((await client.put('/api/me/email', { currentPassword: creds.password, email: otherCreds.email })).status, 409);

  const newEmail = `moved${Date.now()}@example.com`;
  const res = await client.put('/api/me/email', { currentPassword: creds.password, email: newEmail });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.email, newEmail);

  // Profile follows the login, and the session carries the new email.
  const profile = await client.get('/api/me/customer');
  assert.equal(profile.status, 200);
  assert.equal(profile.data.customer.email, newEmail);
  assert.equal(profile.data.customer.firstName, 'Test');
});

test('responses carry security headers (TODO 10)', async () => {
  const res = await makeClient().get('/api/session');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null, 'Express version not advertised');
  assert.ok(res.headers.get('x-frame-options'));
});

test('a login with no customer profile gets a blank one and can fill it in', async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  // e.g. an admin created by scripts/seed.js: a users row with no customers row.
  await Customers.destroy({ where: { email: creds.email } });

  const blank = await client.get('/api/me/customer');
  assert.equal(blank.status, 200);
  assert.equal(blank.data.customer.email, creds.email);
  assert.equal(blank.data.customer.firstName, '');

  const saved = await client.put('/api/me/customer', { firstName: 'Ada', lastName: 'Admin', address: '9 Shop Rd' });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.customer.firstName, 'Ada');

  const profile = await client.get('/api/me/customer');
  assert.equal(profile.data.customer.address, '9 Shop Rd');
  assert.equal(await Customers.count({ where: { email: creds.email } }), 1);
});
