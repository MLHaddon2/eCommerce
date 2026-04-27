import express from 'express';
import { getUsers, getUser, Register, Login, Logout } from '../Controllers/Users.js';
import { createProduct, deleteProduct, getProduct, updateProduct, getProducts } from '../Controllers/Products.js';
import { getCustomer, getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../Controllers/Customers.js';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from '../Controllers/Transactions.js';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../Controllers/Orders.js';

// ⬇️ NEW — import your cleaned route modules
import cartRoutes from './cartRoutes.js';
import ipHistoryRoutes from './ipHistoryRoutes.js';

import { initializeSquareClient, getPayment, updatePayment, cancelPayment, completePayment, createPayment, refundPayment, listPayments } from '../middleware/SquareAPI.js';
// import { createKlarnaSession, authorizeKlarnaPayment, captureKlarnaOrder, refundKlarnaOrder } from '../../Backups/KlarnaAPI.js';
import { refreshToken } from '../Controllers/RefreshToken.js';
import { verifyToken } from '../middleware/VerifyToken.js';
import { getSavedCards, addSavedCard, deleteSavedCard, setDefaultCard } from '../Controllers/SavedCards.js';

const router = express.Router();

/* ---------------------------------------------------------
   AUTH + USER ROUTES
--------------------------------------------------------- */
router.get('/users', verifyToken, getUsers);
router.get('/user', verifyToken, getUser);
router.post('/register', Register);
router.post('/login', Login);
router.post('/logout', Logout);
router.get('/token', refreshToken);

router.get('/verify-token', verifyToken, (req, res) => {
  res.status(200).json({
    user: { id: req.userID, username: req.username, email: req.email }
  });
});

/* ---------------------------------------------------------
   PRODUCTS
--------------------------------------------------------- */
router.get('/products/get/:id', getProduct);
router.get('/products/getallhistory', getProducts);
router.put('/products/update/:id', updateProduct);
router.post('/products/create', createProduct);
router.delete('/products/delete/:id', deleteProduct);

// Placeholder review routes
router.post('/products/:id/reviews', async (req, res) => {
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});
router.put('/products/:id/reviews/:reviewId', async (req, res) => {
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});
router.delete('/products/:id/reviews/:reviewId', async (req, res) => {
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});

/* ---------------------------------------------------------
   CUSTOMERS
--------------------------------------------------------- */
router.get('/customers/get', getCustomers);
router.get('/customers/get/:id', getCustomer);
router.post('/customers/create', createCustomer);
router.put('/customers/update/:id', updateCustomer);
router.delete('/customers/delete/:id', deleteCustomer);

/* ---------------------------------------------------------
   TRANSACTIONS
--------------------------------------------------------- */
router.get('/transactions/get', getTransactions);
router.get('/transactions/get/:id', getTransaction);
router.post('/transactions/create', createTransaction);
router.put('/transactions/update/:id', updateTransaction);
router.delete('/transactions/delete/:id', deleteTransaction);

/* ---------------------------------------------------------
   ORDERS
--------------------------------------------------------- */
router.get('/orders/get', getOrders);
router.get('/orders/get/:id', getOrder);
router.post('/orders/create', createOrder);
router.put('/orders/update/:id', updateOrder);
router.delete('/orders/delete/:id', deleteOrder);

/* ---------------------------------------------------------
   CART (REPLACED OLD ROUTES)
--------------------------------------------------------- */
router.use('/cart', cartRoutes);

/* ---------------------------------------------------------
   IP HISTORY (REPLACED OLD ROUTES)
--------------------------------------------------------- */
router.use('/ip-history', ipHistoryRoutes);

/* ---------------------------------------------------------
   SAVED CARDS
--------------------------------------------------------- */
router.get('/user/saved-cards', verifyToken, getSavedCards);
router.post('/user/saved-cards', verifyToken, addSavedCard);
router.delete('/user/saved-cards/:cardId', verifyToken, deleteSavedCard);
router.patch('/user/saved-cards/:cardId/default', verifyToken, setDefaultCard);

/* ---------------------------------------------------------
   SQUARE PAYMENT API
--------------------------------------------------------- */
router.post('/payments', createPayment);
router.get('/payments/:paymentId', getPayment);
router.put('/payments/:paymentId', updatePayment);
router.delete('/payments/:paymentId', cancelPayment);
router.post('/payments/:paymentId/complete', completePayment);
router.post('/payments/:paymentId/refund', refundPayment);
router.get('/payments', listPayments);
router.get('/square/initialize', initializeSquareClient);

/* ---------------------------------------------------------
   KLARNA PAYMENT API
--------------------------------------------------------- */
// router.post('/payments/v1/session', createKlarnaSession);
// router.post('/payments/v1/authorize', authorizeKlarnaPayment);
// router.post('/payments/v1/capture/:orderId', captureKlarnaOrder);
// router.post('/payments/v1/refund/:orderId', refundKlarnaOrder);

export default router;
