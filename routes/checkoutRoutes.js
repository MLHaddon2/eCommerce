import express from 'express';
import {
  getQuote,
  checkoutWithSquare,
  createPayPalCheckout,
  capturePayPalCheckout
} from '../Controllers/Checkout.js';
import { optionalAuth } from '../middleware/VerifyToken.js';

const router = express.Router();

/* ---------------------------------------------------------
   CHECKOUT ROUTES (guests + logged-in users)
   Uses the server-side cart and server-side prices; the
   request only says where it ships and how it's paid.
--------------------------------------------------------- */

router.use(optionalAuth);

router.post('/quote', getQuote);
router.post('/square', checkoutWithSquare);
router.post('/paypal/order', createPayPalCheckout);
router.post('/paypal/capture', capturePayPalCheckout);

export default router;
