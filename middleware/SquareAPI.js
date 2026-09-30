import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

// Square SDK v42+. Customer checkout goes through Controllers/Checkout.js (chargeCard below);
// the route handlers in this file are admin-only payment management.

// Server-side env var; falls back to the old client-prefixed name.
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || process.env.REACT_APP_SQUARE_LOCATION_ID;

let squareClient = null;

export const getSquareClient = () => {
    if (!squareClient) {
        squareClient = new SquareClient({
            token: process.env.SQUARE_ACCESS_TOKEN,
            environment: process.env.SQUARE_NODE_ENV === 'production'
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox
        });
    }
    return squareClient;
};

// Square returns money amounts as BigInt, which res.json() can't serialize.
const toJSONSafe = (value) =>
    JSON.parse(JSON.stringify(value, (key, v) => (typeof v === 'bigint' ? Number(v) : v)));

// Idempotency keys make retries (double-clicks, network retries) charge only once.
// Accept the browser's key if it looks sane, otherwise make one.
const idempotencyKeyFrom = (key) =>
    typeof key === 'string' && /^[\w-]{8,45}$/.test(key) ? key : randomUUID();

const squareErrorResponse = (res, context, error) => {
    console.error(`${context}:`, error);
    if (error instanceof SquareError) {
        return res.status(error.statusCode && error.statusCode < 500 ? 400 : 502).json({
            success: false,
            message: error.errors?.map((e) => e.detail || e.code).join(', ') || `${context} failed`
        });
    }
    return res.status(500).json({ success: false, message: `${context} failed` });
};

/* ---------------------------------------------------------
   CHECKOUT HELPER (not a route)
--------------------------------------------------------- */

// Charges a card token from the Square Web Payments SDK. amountCents is computed
// server-side by the checkout quote — never taken from the request body.
export const chargeCard = async ({ sourceId, amountCents, idempotencyKey, note, buyerEmailAddress }) => {
    if (!SQUARE_LOCATION_ID) throw new Error('SQUARE_LOCATION_ID is not configured');

    const { payment } = await getSquareClient().payments.create({
        sourceId,
        idempotencyKey: idempotencyKeyFrom(idempotencyKey),
        amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
        locationId: SQUARE_LOCATION_ID,
        autocomplete: true,
        note,
        buyerEmailAddress
    });

    return {
        id: payment.id,
        status: payment.status,
        amountCents: Number(payment.amountMoney?.amount ?? 0),
        lastFour: payment.cardDetails?.card?.last4 || null
    };
};

/* ---------------------------------------------------------
   ADMIN ROUTES
--------------------------------------------------------- */

// GET /api/square/initialize — checks the credentials by listing locations.
export const initializeSquareClientEndpoint = async (req, res) => {
    try {
        const { locations = [] } = await getSquareClient().locations.list();
        return res.status(200).json({
            success: true,
            message: "Square client initialized successfully",
            locationConfigured: locations.some((l) => l.id === SQUARE_LOCATION_ID)
        });
    } catch (error) {
        return squareErrorResponse(res, 'Square connection test', error);
    }
};

export const getPayment = async (req, res) => {
    try {
        const { payment } = await getSquareClient().payments.get({ paymentId: req.params.paymentId });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        return res.status(200).json({ success: true, payment: toJSONSafe(payment) });
    } catch (error) {
        return squareErrorResponse(res, 'Get payment', error);
    }
};

// Only tip changes are supported, and only on payments that aren't completed yet.
export const updatePayment = async (req, res) => {
    try {
        const { tipMoney, versionToken } = req.body;
        const { payment } = await getSquareClient().payments.update({
            paymentId: req.params.paymentId,
            idempotencyKey: randomUUID(),
            payment: {
                versionToken,
                tipMoney: tipMoney
                    ? { amount: BigInt(Math.round(Number(tipMoney.amount))), currency: tipMoney.currency || 'USD' }
                    : undefined
            }
        });
        return res.status(200).json({ success: true, payment: toJSONSafe(payment) });
    } catch (error) {
        return squareErrorResponse(res, 'Update payment', error);
    }
};

export const cancelPayment = async (req, res) => {
    try {
        const { payment } = await getSquareClient().payments.cancel({ paymentId: req.params.paymentId });
        return res.status(200).json({ success: true, payment: toJSONSafe(payment) });
    } catch (error) {
        return squareErrorResponse(res, 'Cancel payment', error);
    }
};

export const completePayment = async (req, res) => {
    try {
        const { payment } = await getSquareClient().payments.complete({ paymentId: req.params.paymentId });
        return res.status(200).json({ success: true, payment: toJSONSafe(payment) });
    } catch (error) {
        return squareErrorResponse(res, 'Complete payment', error);
    }
};

// Body: { amountCents?, reason? } — omit amountCents to refund the full payment.
export const refundPayment = async (req, res) => {
    try {
        const client = getSquareClient();
        const { paymentId } = req.params;

        let amountCents = req.body.amountCents;
        if (amountCents === undefined) {
            const { payment } = await client.payments.get({ paymentId });
            amountCents = Number(payment?.amountMoney?.amount ?? 0);
        }
        if (!Number.isInteger(Number(amountCents)) || Number(amountCents) <= 0) {
            return res.status(400).json({ success: false, message: 'amountCents must be a positive whole number' });
        }

        const { refund } = await client.refunds.refundPayment({
            idempotencyKey: randomUUID(),
            paymentId,
            amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
            reason: req.body.reason || 'Customer requested refund'
        });
        return res.status(201).json({ success: true, refund: toJSONSafe(refund) });
    } catch (error) {
        return squareErrorResponse(res, 'Refund payment', error);
    }
};

export const listPayments = async (req, res) => {
    try {
        const { beginTime, endTime, sortOrder, cursor } = req.query;
        const page = await getSquareClient().payments.list({
            beginTime,
            endTime,
            sortOrder: sortOrder || 'DESC',
            cursor,
            locationId: SQUARE_LOCATION_ID
        });
        return res.status(200).json({ success: true, payments: toJSONSafe(page.data), hasMore: page.hasNextPage() });
    } catch (error) {
        return squareErrorResponse(res, 'List payments', error);
    }
};
