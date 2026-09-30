// Shared test setup: in-memory SQLite app server + a cookie-keeping HTTP client.
// Import this before anything else in a test file — it sets the test env vars.
import { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
// Payment settings for the checkout tests. dotenv never overrides values already set,
// so these win over anything in the real .env. All payment HTTP calls are stubbed.
process.env.SQUARE_ACCESS_TOKEN = 'test-square-token';
process.env.SQUARE_LOCATION_ID = 'TEST_LOCATION';
process.env.SQUARE_NODE_ENV = 'sandbox';
process.env.PAYPAL_CLIENT_ID = 'test-paypal-id';
process.env.PAYPAL_SECRET_KEY = 'test-paypal-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';

const { default: app } = await import('../app.js');
const { initDatabase, default: db } = await import('../config/Database.js');
export const { default: Users } = await import('../models/userModel.js');
export const { default: Product } = await import('../models/productModel.js');
export const { default: Orders } = await import('../models/orderModel.js');
export const { default: Transactions } = await import('../models/transactionModel.js');
export const { default: Customers } = await import('../models/customerModel.js');

let server;
let baseUrl;

before(async () => {
  await initDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

// The real fetch, captured before any test stubs it.
const realFetch = globalThis.fetch;

// A minimal browser: remembers cookies between requests.
export const makeClient = () => {
  const jar = new Map();

  const request = async (method, path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

    const res = await realFetch(baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (value) jar.set(name, value);
      else jar.delete(name);
    }

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  };

  return {
    jar,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body ?? {}),
    put: (path, body) => request('PUT', path, body ?? {}),
    patch: (path, body) => request('PATCH', path, body ?? {}),
    del: (path) => request('DELETE', path)
  };
};

let userCount = 0;
export const registerUser = async (client, overrides = {}) => {
  userCount += 1;
  const tag = `${process.pid}-${userCount}`;
  const creds = {
    username: `user${tag}`,
    email: `user${tag}@example.com`,
    password: 'correct horse',
    confPwd: 'correct horse',
    firstName: 'Test',
    lastName: `User${tag}`,
    address: '1 Test St',
    ...overrides
  };
  const res = await client.post('/api/register', creds);
  assert.equal(res.status, 201, JSON.stringify(res.data));
  return creds;
};

export const makeAdmin = async () => {
  const client = makeClient();
  const creds = await registerUser(client);
  await Users.update({ isAdmin: true }, { where: { username: creds.username } });
  // Log in again so the new token carries isAdmin.
  const res = await client.post('/api/login', { username: creds.username, password: creds.password });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.isAdmin, true);
  return client;
};
