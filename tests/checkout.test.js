// Checkout tests: server-side pricing, Square and PayPal flows, order recording.
// Square and PayPal HTTP calls are intercepted by a fetch stub — nothing leaves the machine.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeClient, registerUser, makeAdmin, Product, Orders, Transactions, Customers } from './helpers.js';
const { sentMail } = await import('../utils/mailer.js');
const { PAYMENT_METHODS } = await import('../config/paymentMethods.js');

/* ── Payment processor stub ────────────────────────────────────────────── */

const realFetch = globalThis.fetch;
let processorCalls = [];
let squareDecline = false;
const paypalOrders = new Map();

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url ?? String(input);
  const method = (init.method || 'GET').toUpperCase();
  let body = null;
  try { body = init.body ? JSON.parse(init.body) : null; } catch { body = init.body; } // OAuth body is form-encoded

  if (url.includes('squareupsandbox.com')) {
    processorCalls.push({ processor: 'square', method, url, body });
    if (url.endsWith('/v2/payments') && method === 'POST') {
      if (squareDecline) {
        return json(402, { errors: [{ category: 'PAYMENT_METHOD_ERROR', code: 'CARD_DECLINED', detail: 'Card declined.' }] });
      }
      return json(200, {
        payment: {
          id: `sq_${processorCalls.length}`,
          status: 'COMPLETED',
          amount_money: { amount: body.amount_money.amount, currency: 'USD' },
          card_details: { card: { last_4: '1111' } }
        }
      });
    }
  }

  if (url.includes('api-m.sandbox.paypal.com')) {
    processorCalls.push({ processor: 'paypal', method, url, body });
    if (url.endsWith('/v1/oauth2/token')) return json(200, { access_token: 'pp-token', expires_in: 3600 });

    if (url.endsWith('/v2/checkout/orders') && method === 'POST') {
      const id = `PP${paypalOrders.size + 1}`;
      paypalOrders.set(id, body.purchase_units[0].amount.value);
      return json(201, { id, status: 'CREATED' });
    }

    const match = url.match(/\/v2\/checkout\/orders\/([^/]+)(\/capture)?$/);
    if (match) {
      const [, id, capture] = match;
      const value = paypalOrders.get(id);
      if (!capture) return json(200, { id, status: 'APPROVED', purchase_units: [{ amount: { currency_code: 'USD', value } }] });
      return json(201, {
        id,
        status: 'COMPLETED',
        purchase_units: [{ payments: { captures: [{ id: `CAP-${id}`, status: 'COMPLETED', amount: { currency_code: 'USD', value } }] } }]
      });
    }
  }

  if (url.startsWith('http://127.0.0.1')) return realFetch(input, init);
  throw new Error(`Unexpected network call in test: ${method} ${url}`);
};

beforeEach(() => {
  processorCalls = [];
  squareDecline = false;
});

/* ── Helpers ───────────────────────────────────────────────────────────── */

const makeProduct = (overrides = {}) => Product.create({
  name: 'Trail Boot', summary: 's', description: 'd', reviews: [], availability: 5,
  price: 19.99, category: ['boots'], isDonation: false, ...overrides
});

// The browser's cart copy includes a price — the server must ignore it.
const cartWith = async (client, lines) => {
  await client.get('/api/cart');
  const res = await client.put('/api/cart', {
    cartItems: lines.map(([product, quantity]) => ({ id: product.id, name: product.name, price: 0.01, quantity }))
  });
  assert.equal(res.status, 200);
};

const squareCharges = () => processorCalls.filter((c) => c.processor === 'square' && c.method === 'POST');

/* ── Quote ─────────────────────────────────────────────────────────────── */

test('quote uses database prices and server tax, ignoring prices in the cart', async () => {
  const product = await makeProduct();
  const guest = makeClient();
  await cartWith(guest, [[product, 2]]);

  const res = await guest.post('/api/checkout/quote', { shippingState: 'ca' });
  assert.equal(res.status, 200);
  const { quote } = res.data;
  assert.equal(quote.subtotalCents, 3998);          // 2 × $19.99, not 2 × $0.01
  assert.equal(quote.taxCents, 290);                // 7.25% CA, rounded
  assert.equal(quote.totalCents, 4288);
  assert.equal(quote.shippingState, 'CA');
});

test('physical goods need a valid state; donations need none and are not taxed', async () => {
  const boot = await makeProduct();
  const donation = await makeProduct({ name: 'Donation', price: 25, isDonation: true, availability: 0 });

  const shopper = makeClient();
  await cartWith(shopper, [[boot, 1]]);
  assert.equal((await shopper.post('/api/checkout/quote', {})).status, 400);
  assert.equal((await shopper.post('/api/checkout/quote', { shippingState: 'ZZ' })).status, 400);

  const donor = makeClient();
  await cartWith(donor, [[donation, 2]]);
  const res = await donor.post('/api/checkout/quote', {});
  assert.equal(res.status, 200);
  assert.equal(res.data.quote.taxCents, 0);
  assert.equal(res.data.quote.totalCents, 5000);
  assert.equal(res.data.quote.requiresShipping, false);
});

test('quote rejects an empty cart and more than is in stock', async () => {
  const empty = makeClient();
  await empty.get('/api/cart');
  assert.equal((await empty.post('/api/checkout/quote', { shippingState: 'TX' })).status, 400);

  const product = await makeProduct({ availability: 1 });
  const greedy = makeClient();
  await cartWith(greedy, [[product, 3]]);
  const res = await greedy.post('/api/checkout/quote', { shippingState: 'TX' });
  assert.equal(res.status, 409);
});

/* ── Square ────────────────────────────────────────────────────────────── */

test('Square checkout charges the server total and records the order', async () => {
  const product = await makeProduct({ availability: 5 });
  const customer = makeClient();
  const creds = await registerUser(customer);
  await cartWith(customer, [[product, 2]]);

  const res = await customer.post('/api/checkout/square', {
    sourceId: 'cnon:card-nonce-ok',
    shippingState: 'CA',
    amount: 0.01 // ignored
  });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal(res.data.totalCents, 4288);

  const [charge] = squareCharges();
  assert.equal(Number(charge.body.amount_money.amount), 4288);
  assert.equal(charge.body.location_id, 'TEST_LOCATION');

  const order = await Orders.findByPk(res.data.orderId);
  const txn = await Transactions.findOne({ where: { orderId: order.id } });
  const profile = await Customers.findOne({ where: { email: creds.email } });
  assert.equal(Number(order.totalAmount), 42.88);
  assert.equal(order.customerId, profile.id);
  assert.equal(txn.paymentMethod, 'Square');
  assert.equal(txn.lastFour, '1111');
  assert.ok(txn.processorPaymentId.startsWith('sq_'));
  assert.equal((await Product.findByPk(product.id)).availability, 3);
  assert.equal(profile.totalOrders, 1);
  assert.equal(Number(profile.totalSpent), 42.88);

  assert.deepEqual((await customer.get('/api/cart')).data.cartItems, []);
  const myOrders = await customer.get('/api/me/orders');
  assert.equal(myOrders.data.length, 1);
});

test('a declined Square card records nothing and keeps the cart', async () => {
  squareDecline = true;
  const product = await makeProduct({ availability: 5 });
  const guest = makeClient();
  await cartWith(guest, [[product, 1]]);
  const ordersBefore = await Orders.count();

  const res = await guest.post('/api/checkout/square', { sourceId: 'cnon:card-nonce-declined', shippingState: 'NY', email: 'guest@example.com' });
  assert.equal(res.status, 402);
  assert.match(res.data.message, /declined/i);

  assert.equal(await Orders.count(), ordersBefore);
  assert.equal((await Product.findByPk(product.id)).availability, 5);
  assert.equal((await guest.get('/api/cart')).data.cartItems.length, 1);
});

test('out-of-stock carts are rejected before the card is charged', async () => {
  const product = await makeProduct({ availability: 1 });
  const guest = makeClient();
  await cartWith(guest, [[product, 2]]);

  const res = await guest.post('/api/checkout/square', { sourceId: 'cnon:card-nonce-ok', shippingState: 'NY', email: 'guest@example.com' });
  assert.equal(res.status, 409);
  assert.equal(squareCharges().length, 0);
});

/* ── PayPal ────────────────────────────────────────────────────────────── */

test('PayPal order is created with the server total and captured into an order', async () => {
  const product = await makeProduct({ price: 10 });
  const guest = makeClient();
  await cartWith(guest, [[product, 3]]);

  const created = await guest.post('/api/checkout/paypal/order', { shippingState: 'OR', email: 'guest@example.com' }); // 0% tax
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const createCall = processorCalls.find((c) => c.url.endsWith('/v2/checkout/orders'));
  assert.equal(createCall.body.purchase_units[0].amount.value, '30.00');

  const captured = await guest.post('/api/checkout/paypal/capture', { orderID: created.data.id, shippingState: 'OR', email: 'guest@example.com' });
  assert.equal(captured.status, 201, JSON.stringify(captured.data));
  assert.equal(captured.data.totalCents, 3000);

  const txn = await Transactions.findOne({ where: { orderId: captured.data.orderId } });
  assert.equal(txn.paymentMethod, 'PayPal');
  assert.equal(txn.processorPaymentId, `CAP-${created.data.id}`);
  assert.deepEqual((await guest.get('/api/cart')).data.cartItems, []);
});

test('PayPal capture is refused if the cart changed after the order was created', async () => {
  const product = await makeProduct({ price: 10 });
  const guest = makeClient();
  await cartWith(guest, [[product, 1]]);

  const created = await guest.post('/api/checkout/paypal/order', { shippingState: 'OR', email: 'guest@example.com' });
  await cartWith(guest, [[product, 2]]);

  const captured = await guest.post('/api/checkout/paypal/capture', { orderID: created.data.id, shippingState: 'OR', email: 'guest@example.com' });
  assert.equal(captured.status, 409);
  assert.ok(!processorCalls.some((c) => c.url.endsWith('/capture')), 'must not capture');
});

test('the old client-priced payment route is gone', async () => {
  const guest = makeClient();
  const res = await guest.post('/api/payments', { sourceId: 'x', amount: 1 });
  assert.equal(res.status, 404);
});

/* ── Receipts and order status (TODO 5) ────────────────────────────────── */

test('guests must give a receipt email before anything is charged', async () => {
  const product = await makeProduct();
  const guest = makeClient();
  await cartWith(guest, [[product, 1]]);

  const res = await guest.post('/api/checkout/square', { sourceId: 'cnon:card-nonce-ok', shippingState: 'NY' });
  assert.equal(res.status, 400);
  assert.equal(squareCharges().length, 0);
  assert.equal((await guest.post('/api/checkout/paypal/order', { shippingState: 'NY', email: 'nope' })).status, 400);
});

test('checkout emails a receipt and admins can move an order through shipping', async () => {
  const product = await makeProduct({ price: 40 });
  const customer = makeClient();
  const creds = await registerUser(customer);
  await cartWith(customer, [[product, 1]]);
  sentMail.length = 0;

  const paid = await customer.post('/api/checkout/square', { sourceId: 'cnon:card-nonce-ok', shippingState: 'OR' });
  assert.equal(paid.status, 201);
  assert.equal(paid.data.receiptEmail, creds.email, 'logged-in users default to their account email');
  await new Promise((r) => setTimeout(r, 50)); // receipt is sent without blocking the response
  const receipt = sentMail.find((m) => m.to === creds.email);
  assert.ok(receipt, 'receipt sent');
  assert.match(receipt.subject, new RegExp(`Order #${paid.data.orderId} confirmed`));
  assert.match(receipt.text, /Trail Boot × 1/);

  const admin = await makeAdmin();
  const url = `/api/orders/${paid.data.orderId}/status`;
  assert.equal((await customer.patch(url, { status: 'Shipped' })).status, 403);
  assert.equal((await admin.patch(url, { status: 'Lost in space' })).status, 400);
  assert.equal((await admin.patch(url, { status: 'Shipped', trackingCarrier: 'Pigeon' })).status, 400);

  const shipped = await admin.patch(url, { status: 'Shipped', trackingCarrier: 'UPS', trackingNumber: '1Z999AA10123456784' });
  assert.equal(shipped.status, 200);
  assert.equal(shipped.data.emailed, true);
  const notice = sentMail.find((m) => m.subject === `Order #${paid.data.orderId}: Shipped`);
  assert.match(notice.text, /ups\.com\/track\?tracknum=1Z999AA10123456784/);

  // The customer sees status, tracking and history.
  const [mine] = (await customer.get('/api/me/orders')).data;
  assert.equal(mine.orderStatus, 'Shipped');
  assert.equal(mine.trackingNumber, '1Z999AA10123456784');
  assert.deepEqual(mine.statusHistory.map((h) => h.status), ['Paid', 'Shipped']);

  // Re-saving the same status (e.g. fixing a tracking number) doesn't email again.
  sentMail.length = 0;
  assert.equal((await admin.patch(url, { status: 'Shipped', trackingCarrier: 'UPS', trackingNumber: '1Z999AA10123456785' })).data.emailed, false);
  assert.equal(sentMail.length, 0);
});

test('admin order and transaction edits no longer crash', async () => {
  const admin = await makeAdmin();
  const order = await Orders.create({ orderDate: new Date(), orderItems: [], totalAmount: 5, orderStatus: 'Paid' });
  const edited = await admin.put(`/api/orders/update/${order.id}`, { shippingAddress: '9 New Rd' });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.updatedOrder.shippingAddress, '9 New Rd');

  const txn = await Transactions.create({ orderId: order.id, amount: 5, status: 'Completed', timeline: [] });
  const res = await admin.put(`/api/transactions/update/${txn.id}`, { status: 'Refunded' });
  assert.equal(res.status, 200);
  assert.equal(res.data.updatedTransaction.status, 'Refunded');
  assert.equal(res.data.updatedTransaction.timeline.at(-1).status, 'Refunded');
});

test('payment methods can be switched off per shipping state (TODO 4)', async () => {
  const product = await makeProduct();
  const guest = makeClient();
  await cartWith(guest, [[product, 1]]);
  PAYMENT_METHODS.paypal.excludedStates.push('HI');
  try {
    const hi = (await guest.post('/api/checkout/quote', { shippingState: 'HI' })).data.quote;
    assert.deepEqual(hi.paymentMethods.map((m) => m.id), ['square']);
    const ca = (await guest.post('/api/checkout/quote', { shippingState: 'CA' })).data.quote;
    assert.deepEqual(ca.paymentMethods.map((m) => m.id), ['square', 'paypal']);

    const blocked = await guest.post('/api/checkout/paypal/order', { shippingState: 'HI', email: 'guest@example.com' });
    assert.equal(blocked.status, 400);
    assert.ok(!processorCalls.some((c) => c.processor === 'paypal' && c.url.endsWith('/v2/checkout/orders')));
  } finally {
    PAYMENT_METHODS.paypal.excludedStates.length = 0;
  }
});
