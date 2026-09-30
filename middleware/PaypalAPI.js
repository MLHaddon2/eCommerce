import dotenv from "dotenv";

dotenv.config();

// PayPal Orders v2 REST API. Orders are created and captured server-side with the
// server-computed quote, so the browser can't change what gets charged.
// Env: PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY, PAYPAL_ENVIRONMENT (sandbox | production).

const baseUrl = () =>
  process.env.PAYPAL_ENVIRONMENT === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export class PayPalError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let cachedToken = null; // { value, expiresAt }

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const { PAYPAL_CLIENT_ID, PAYPAL_SECRET_KEY } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET_KEY) {
    throw new PayPalError('PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_SECRET_KEY)', 500);
  }

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET_KEY}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok) throw new PayPalError('PayPal authentication failed', 502, data);

  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
};

const paypalRequest = async (method, path, body) => {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PayPalError(data?.details?.[0]?.description || data?.message || 'PayPal request failed', res.status, data);
  }
  return data;
};

const money = (cents) => ({ currency_code: 'USD', value: (cents / 100).toFixed(2) });

// quote: the object returned by buildQuote() in Controllers/Checkout.js
export const createPayPalOrder = (quote) =>
  paypalRequest('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        ...money(quote.totalCents),
        breakdown: {
          item_total: money(quote.subtotalCents),
          tax_total: money(quote.taxCents)
        }
      },
      items: quote.lines.map((line) => ({
        name: line.name.slice(0, 127),
        quantity: String(line.quantity),
        unit_amount: money(line.unitPriceCents),
        category: line.isDonation ? 'DONATION' : 'PHYSICAL_GOODS'
      }))
    }]
  });

export const getPayPalOrder = (orderId) =>
  paypalRequest('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);

export const capturePayPalOrder = (orderId) =>
  paypalRequest('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`);

// Total of an order (as created) in cents.
export const paypalOrderTotalCents = (order) =>
  Math.round(Number(order?.purchase_units?.[0]?.amount?.value ?? 0) * 100);

// The capture id and captured amount from a capture response.
export const paypalCaptureDetails = (captured) => {
  const capture = captured?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: capture?.id || captured?.id,
    status: capture?.status || captured?.status,
    amountCents: Math.round(Number(capture?.amount?.value ?? 0) * 100)
  };
};
