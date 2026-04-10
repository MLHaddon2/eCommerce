import express from 'express';
import {
  updateCartItems,
  getCartItems,
  deleteCartItem
} from '../Controllers/Cart.js';

const router = express.Router();

/* ---------------------------------------------------------
   USER CART ROUTES
--------------------------------------------------------- */

// Get user cart
router.get('/get/:userId/:ipAddress', getCartItems);

// Update user cart
router.post('/update/:userId/:ipAddress', updateCartItems);

// Delete item from user cart
router.delete('/delete/:userId/:productId/:ipAddress', deleteCartItem);


/* ---------------------------------------------------------
   GUEST CART ROUTES
--------------------------------------------------------- */

// Get guest cart
router.get('/get/:ipAddress', (req, res) => {
  req.params.userId = '0000';
  return getCartItems(req, res);
});

// Update guest cart
router.post('/update/:ipAddress', (req, res) => {
  req.params.userId = '0000';
  return updateCartItems(req, res);
});

// Delete item from guest cart
router.delete('/delete/:ipAddress/:productId', (req, res) => {
  req.params.userId = '0000';
  return deleteCartItem(req, res);
});

export default router;
