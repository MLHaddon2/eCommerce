import express from 'express';
import {
  updateCartItems,
  getCartItems,
  deleteCartItem
} from '../Controllers/Cart.js';
import { optionalAuth } from '../middleware/VerifyToken.js';

const router = express.Router();

/* ---------------------------------------------------------
   CART ROUTES
   The cart owner is resolved server-side: the logged-in user's
   customer cart if there's a valid token, otherwise the guest
   cart for the httpOnly sessionId cookie.
--------------------------------------------------------- */

router.use(optionalAuth);

// Get cart
router.get('/', getCartItems);

// Replace cart contents
router.put('/', updateCartItems);

// Decrement / remove one item
router.delete('/:productId', deleteCartItem);

export default router;
