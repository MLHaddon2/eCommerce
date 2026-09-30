import db from '../config/Database.js';
import Product from '../models/productModel.js';
import Orders from '../models/orderModel.js';
import Transactions from '../models/transactionModel.js';
import Customers from '../models/customerModel.js';
import { resolveCart } from './Cart.js';
import { chargeCard } from '../middleware/SquareAPI.js';
import {
  PayPalError,
  createPayPalOrder,
  getPayPalOrder,
  capturePayPalOrder,
  paypalOrderTotalCents,
  paypalCaptureDetails
} from '../middleware/PaypalAPI.js';
import { SquareError } from 'square';
import { handleError } from '../utils/handleError.js';
import { isValidState, normalizeState, taxRateFor } from '../utils/tax.js';
import { sendMail } from '../utils/mailer.js';
import { orderConfirmationEmail } from '../utils/orderStatus.js';
import { paymentMethodsFor, isPaymentMethodAllowed } from '../config/paymentMethods.js';

// Checkout is server-authoritative:
//   - Items come from the cart stored on the server (see Cart.js), not the request.
//   - Prices come from the products table; tax from utils/tax.js.
//   - The amount charged is always the server quote, in cents.
// Works for guests and logged-in customers (optionalAuth on the routes).

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ---------------------------------------------------------
   QUOTE
--------------------------------------------------------- */

// cartItems: [{ id, quantity, ... }] — only id and quantity are used.
export const buildQuote = async (cartItems, shippingState) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new CheckoutError(400, 'Your cart is empty');
  }

  const ids = cartItems.map((i) => i.id);
  const products = await Product.findAll({ where: { id: ids } });
  const byId = new Map(products.map((p) => [String(p.id), p]));

  const lines = cartItems.map((item) => {
    const product = byId.get(String(item.id));
    if (!product) throw new CheckoutError(409, `An item in your cart is no longer available`);

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new CheckoutError(400, 'Invalid quantity in cart');

    if (!product.isDonation && product.availability !== null && quantity > product.availability) {
      throw new CheckoutError(409, `Only ${product.availability} of "${product.name}" left in stock`);
    }

    const unitPriceCents = Math.round(Number(product.price) * 100);
    return {
      productId: product.id,
      name: product.name,
      quantity,
      unitPriceCents,
      price: unitPriceCents / 100, // dollars — what the admin panel's order views read
      lineTotalCents: unitPriceCents * quantity,
      isDonation: Boolean(product.isDonation)
    };
  });

  // Donations aren't taxed and don't ship.
  const taxableCents = lines.filter((l) => !l.isDonation).reduce((sum, l) => sum + l.lineTotalCents, 0);
  const requiresShipping = lines.some((l) => !l.isDonation);

  const state = normalizeState(shippingState);
  if (requiresShipping && !isValidState(state)) {
    throw new CheckoutError(400, 'Please choose a valid US shipping state');
  }

  const taxRate = requiresShipping ? taxRateFor(state) : 0;
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const taxCents = Math.round(taxableCents * taxRate);
  const totalCents = subtotalCents + taxCents;

  if (totalCents <= 0) throw new CheckoutError(400, 'Order total must be greater than zero');

  const shipsTo = requiresShipping ? state : null;
  return {
    lines,
    shippingState: shipsTo,
    paymentMethods: paymentMethodsFor(shipsTo),
    requiresShipping,
    taxRate,
    subtotalCents,
    taxCents,
    totalCents
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where the receipt goes: the address typed at checkout, else the logged-in user's email.
// Guests must give one. Checked before any money moves.
const receiptEmailFor = (req) => {
  const typed = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (typed) {
    if (!EMAIL_PATTERN.test(typed) || typed.length > 255) throw new CheckoutError(400, 'Please enter a valid email for your receipt');
    return typed;
  }
  if (req.email) return req.email;
  throw new CheckoutError(400, 'Please enter an email address for your receipt');
};

// paymentMethod: when given, the quote must allow it for the shipping state (TODO 4).
const quoteForRequest = async (req, paymentMethod) => {
  const cart = await resolveCart(req);
  if (!cart) throw new CheckoutError(400, 'No session — enable cookies to check out');
  const quote = await buildQuote(cart.cartItems, req.body.shippingState);
  if (paymentMethod && !isPaymentMethodAllowed(paymentMethod, quote.shippingState)) {
    throw new CheckoutError(400, `That payment method isn't available for orders shipping to ${quote.shippingState}`);
  }
  return { cart, quote };
};

/* ---------------------------------------------------------
   RECORD THE ORDER (after payment succeeded)
--------------------------------------------------------- */

const cleanAddress = (address) =>
  typeof address === 'string' ? address.trim().slice(0, 255) : '';

const recordOrder = async (req, cart, quote, { paymentMethod, processorPaymentId, lastFour, amountCents, customerEmail }) => {
  const customer = req.email ? await Customers.findOne({ where: { email: req.email } }) : null;
  const now = new Date();
  const total = amountCents / 100;

  const order = await db.transaction(async (transaction) => {
    const order = await Orders.create({
      customerId: customer?.id ?? null,
      orderDate: now,
      orderItems: quote.lines,
      totalAmount: total,
      shippingAddress: cleanAddress(req.body.shippingAddress) || quote.shippingState || '',
      paymentMethod,
      orderStatus: 'Paid',
      customerEmail,
      statusHistory: [{ status: 'Paid', date: now.toISOString() }]
    }, { transaction });

    await Transactions.create({
      orderId: order.id,
      customerId: customer?.id ?? null,
      amount: total,
      status: 'Completed',
      timestamp: now,
      paymentMethod,
      lastFour,
      processorPaymentId,
      timeline: [{ status: 'Completed', date: now.toISOString() }]
    }, { transaction });

    for (const line of quote.lines.filter((l) => !l.isDonation)) {
      await Product.decrement('availability', { by: line.quantity, where: { id: line.productId }, transaction });
    }

    if (customer) {
      await customer.update({
        totalOrders: (customer.totalOrders || 0) + 1,
        totalSpent: Number(customer.totalSpent || 0) + total
      }, { transaction });
    }

    return order;
  });

  await cart.save([]);
  // Not awaited: the receipt email shouldn't slow down (or fail) the checkout response.
  sendMail(orderConfirmationEmail(order));
  return order;
};

// The card was charged but saving the order failed — log everything needed to reconcile.
const logUnrecordedPayment = (paymentMethod, processorPaymentId, quote, error) => {
  console.error('❌ PAYMENT TAKEN BUT ORDER NOT RECORDED — reconcile manually:', {
    paymentMethod, processorPaymentId, totalCents: quote.totalCents, lines: quote.lines
  }, error);
};

const checkoutErrorResponse = (res, context, error) => {
  if (error instanceof CheckoutError) return res.status(error.status).json({ success: false, message: error.message });
  if (error instanceof SquareError) {
    console.error(`${context}:`, error);
    const message = error.errors?.map((e) => e.detail || e.code).join(', ') || 'The card was declined';
    return res.status(402).json({ success: false, message });
  }
  if (error instanceof PayPalError) {
    console.error(`${context}:`, error.details || error);
    return res.status(error.status >= 500 ? 502 : 400).json({ success: false, message: error.message });
  }
  return handleError(res, context, error);
};

/* ---------------------------------------------------------
   ROUTES
--------------------------------------------------------- */

// POST /api/checkout/quote  { shippingState }
export const getQuote = async (req, res) => {
  try {
    const { quote } = await quoteForRequest(req);
    res.status(200).json({ success: true, quote });
  } catch (error) {
    return checkoutErrorResponse(res, 'Checkout quote', error);
  }
};

// POST /api/checkout/square  { sourceId, shippingState, shippingAddress?, idempotencyKey? }
export const checkoutWithSquare = async (req, res) => {
  let payment;
  let quote;
  try {
    if (typeof req.body.sourceId !== 'string' || !req.body.sourceId) {
      return res.status(400).json({ success: false, message: 'Missing card token' });
    }

    const customerEmail = receiptEmailFor(req);
    const result = await quoteForRequest(req, 'square');
    quote = result.quote;

    payment = await chargeCard({
      sourceId: req.body.sourceId,
      amountCents: quote.totalCents,
      idempotencyKey: req.body.idempotencyKey,
      note: `Order — ${quote.lines.length} item(s)`,
      buyerEmailAddress: customerEmail
    });

    if (payment.status !== 'COMPLETED') {
      return res.status(402).json({ success: false, message: `Payment ${payment.status?.toLowerCase() || 'failed'}` });
    }

    const order = await recordOrder(req, result.cart, quote, {
      paymentMethod: 'Square',
      processorPaymentId: payment.id,
      lastFour: payment.lastFour,
      amountCents: payment.amountCents,
      customerEmail
    });

    res.status(201).json({ success: true, orderId: order.id, totalCents: payment.amountCents, receiptEmail: customerEmail });
  } catch (error) {
    if (payment?.status === 'COMPLETED') logUnrecordedPayment('Square', payment.id, quote, error);
    return checkoutErrorResponse(res, 'Square checkout', error);
  }
};

// POST /api/checkout/paypal/order  { shippingState } → { id }
// The PayPal button's createOrder calls this, so the amount comes from the server quote.
export const createPayPalCheckout = async (req, res) => {
  try {
    receiptEmailFor(req); // fail before the PayPal window opens
    const { quote } = await quoteForRequest(req, 'paypal');
    const order = await createPayPalOrder(quote);
    res.status(201).json({ success: true, id: order.id });
  } catch (error) {
    return checkoutErrorResponse(res, 'PayPal create order', error);
  }
};

// POST /api/checkout/paypal/capture  { orderID, shippingState, shippingAddress? }
export const capturePayPalCheckout = async (req, res) => {
  let capture;
  let quote;
  try {
    const { orderID } = req.body;
    if (typeof orderID !== 'string' || !orderID) {
      return res.status(400).json({ success: false, message: 'Missing PayPal order id' });
    }

    const customerEmail = receiptEmailFor(req);
    const result = await quoteForRequest(req, 'paypal');
    quote = result.quote;

    // Only capture if the PayPal order still matches the current cart total —
    // guards against the cart changing between "create order" and "approve".
    const paypalOrder = await getPayPalOrder(orderID);
    if (paypalOrderTotalCents(paypalOrder) !== quote.totalCents) {
      return res.status(409).json({ success: false, message: 'Your cart changed during checkout. Please try again.' });
    }

    capture = paypalCaptureDetails(await capturePayPalOrder(orderID));
    if (capture.status !== 'COMPLETED') {
      return res.status(402).json({ success: false, message: `PayPal payment ${capture.status?.toLowerCase() || 'failed'}` });
    }

    const order = await recordOrder(req, result.cart, quote, {
      paymentMethod: 'PayPal',
      processorPaymentId: capture.id,
      lastFour: null,
      amountCents: capture.amountCents,
      customerEmail
    });

    res.status(201).json({ success: true, orderId: order.id, totalCents: capture.amountCents, receiptEmail: customerEmail });
  } catch (error) {
    if (capture?.status === 'COMPLETED') logUnrecordedPayment('PayPal', capture.id, quote, error);
    return checkoutErrorResponse(res, 'PayPal capture', error);
  }
};
