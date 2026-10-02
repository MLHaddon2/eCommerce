import express from 'express';
import { getUsers, getUser, Register, Login, Logout } from '../Controllers/Users.js';
import { createProduct, deleteProduct, getProduct, updateProduct, getProducts, addReview, updateReview, deleteReview } from '../Controllers/Products.js';
import { getCustomer, getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../Controllers/Customers.js';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from '../Controllers/Transactions.js';
import { getOrders, getOrder, createOrder, updateOrder, updateOrderStatus, deleteOrder } from '../Controllers/Orders.js';
import { getMyCustomer, updateMyCustomer, getMyOrders, changeMyPassword, changeMyUsername, changeMyEmail } from '../Controllers/Me.js';
import { sendContactMessage } from '../Controllers/Contact.js';

import cartRoutes from './cartRoutes.js';
import ipHistoryRoutes from './ipHistoryRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';

import { initializeSquareClientEndpoint, getPayment, updatePayment, cancelPayment, completePayment, refundPayment, listPayments } from '../middleware/SquareAPI.js';
// import { createKlarnaSession, authorizeKlarnaPayment, captureKlarnaOrder, refundKlarnaOrder } from '../../Backups/KlarnaAPI.js';
import { refreshToken, getSession } from '../Controllers/RefreshToken.js';
import { verifyToken, verifyAdmin, optionalAuth } from '../middleware/VerifyToken.js';
import { getSavedCards, addSavedCard, deleteSavedCard, setDefaultCard } from '../Controllers/SavedCards.js';

// Access levels:
//   public       — no middleware
//   verifyToken  — any logged-in user; acts only on their own data (req.userID / req.email)
//   verifyAdmin  — users.isAdmin = true (checked from the signed JWT)

const router = express.Router();

/* ---------------------------------------------------------
   AUTH + USER ROUTES
--------------------------------------------------------- */
router.get('/users', verifyAdmin, getUsers);
router.get('/user', verifyToken, getUser);
router.post('/register', Register);
router.post('/login', Login);
router.post('/logout', Logout);
router.get('/token', refreshToken);
router.get('/session', optionalAuth, getSession);

router.get('/verify-token', verifyToken, (req, res) => {
  res.status(200).json({
    user: { id: req.userID, username: req.username, email: req.email, isAdmin: req.isAdmin }
  });
});

/* ---------------------------------------------------------
   MY ACCOUNT (logged-in user's own data)
--------------------------------------------------------- */
router.get('/me/customer', verifyToken, getMyCustomer);
router.put('/me/customer', verifyToken, updateMyCustomer);
router.get('/me/orders', verifyToken, getMyOrders);
router.put('/me/password', verifyToken, changeMyPassword);
router.put('/me/username', verifyToken, changeMyUsername);
router.put('/me/email', verifyToken, changeMyEmail);

/* ---------------------------------------------------------
   PRODUCTS
--------------------------------------------------------- */
router.get('/products/get/:id', getProduct);
router.get('/products/getallhistory', getProducts);
router.put('/products/update/:id', verifyAdmin, updateProduct);
router.post('/products/create', verifyAdmin, createProduct);
router.delete('/products/delete/:id', verifyAdmin, deleteProduct);

router.post('/products/:id/reviews', verifyToken, addReview);
// Authors edit/delete their own reviews; admins can delete any (moderation).
router.put('/products/:id/reviews/:reviewId', verifyToken, updateReview);
router.delete('/products/:id/reviews/:reviewId', verifyToken, deleteReview);

/* ---------------------------------------------------------
   CUSTOMERS (admin)
--------------------------------------------------------- */
router.get('/customers/get', verifyAdmin, getCustomers);
router.get('/customers/get/:id', verifyAdmin, getCustomer);
router.post('/customers/create', verifyAdmin, createCustomer);
router.put('/customers/update/:id', verifyAdmin, updateCustomer);
router.delete('/customers/delete/:id', verifyAdmin, deleteCustomer);

/* ---------------------------------------------------------
   TRANSACTIONS (admin)
--------------------------------------------------------- */
router.get('/transactions/get', verifyAdmin, getTransactions);
router.get('/transactions/get/:id', verifyAdmin, getTransaction);
router.post('/transactions/create', verifyAdmin, createTransaction);
router.put('/transactions/update/:id', verifyAdmin, updateTransaction);
router.delete('/transactions/delete/:id', verifyAdmin, deleteTransaction);

/* ---------------------------------------------------------
   ORDERS (admin)
--------------------------------------------------------- */
router.get('/orders/get', verifyAdmin, getOrders);
router.get('/orders/get/:id', verifyAdmin, getOrder);
router.post('/orders/create', verifyAdmin, createOrder);
router.put('/orders/update/:id', verifyAdmin, updateOrder);
router.patch('/orders/:id/status', verifyAdmin, updateOrderStatus);
router.delete('/orders/delete/:id', verifyAdmin, deleteOrder);

/* ---------------------------------------------------------
   CART (guests + logged-in users) and IP HISTORY (admin)
--------------------------------------------------------- */
router.use('/cart', cartRoutes);
router.use('/ip-history', ipHistoryRoutes);

/* ---------------------------------------------------------
   CHECKOUT (guests + logged-in users) — prices computed server-side
--------------------------------------------------------- */
router.use('/checkout', checkoutRoutes);

/* ---------------------------------------------------------
   CONTACT FORM (guests + logged-in users)
--------------------------------------------------------- */
router.post('/contact', optionalAuth, sendContactMessage);

/* ---------------------------------------------------------
   SAVED CARDS
--------------------------------------------------------- */
router.get('/user/saved-cards', verifyToken, getSavedCards);
router.post('/user/saved-cards', verifyToken, addSavedCard);
router.delete('/user/saved-cards/:cardId', verifyToken, deleteSavedCard);
router.patch('/user/saved-cards/:cardId/default', verifyToken, setDefaultCard);

/* ---------------------------------------------------------
   SQUARE PAYMENT MANAGEMENT (admin)
   Customer payments go through /api/checkout.
--------------------------------------------------------- */
router.get('/payments/:paymentId', verifyAdmin, getPayment);
router.put('/payments/:paymentId', verifyAdmin, updatePayment);
router.delete('/payments/:paymentId', verifyAdmin, cancelPayment);
router.post('/payments/:paymentId/complete', verifyAdmin, completePayment);
router.post('/payments/:paymentId/refund', verifyAdmin, refundPayment);
router.get('/payments', verifyAdmin, listPayments);
router.get('/square/initialize', verifyAdmin, initializeSquareClientEndpoint);

/* ---------------------------------------------------------
   KLARNA PAYMENT API
--------------------------------------------------------- */
// router.post('/payments/v1/session', createKlarnaSession);
// router.post('/payments/v1/authorize', authorizeKlarnaPayment);
// router.post('/payments/v1/capture/:orderId', captureKlarnaOrder);
// router.post('/payments/v1/refund/:orderId', refundKlarnaOrder);

export default router;
