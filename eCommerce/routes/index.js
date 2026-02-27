import express from 'express';
import { getUsers, getUser, Register, Login, Logout } from '../Controllers/Users.js';
import { createProduct, deleteProduct, getProduct, updateProduct, getProducts } from '../Controllers/Products.js';
import { getCustomer, getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../Controllers/Customers.js';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction } from '../Controllers/Transactions.js';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../Controllers/Orders.js';
import { updateCartItems, deleteCartItem, getCartItems } from '../Controllers/Cart.js';
import { getIpHistory, getIpHistories, createIpHistory, updateIpHistory, deleteIpHistory } from '../Controllers/IpHistory.js';
import { initializeSquareClient, getPayment, updatePayment, cancelPayment, completePayment, createPayment, refundPayment, listPayments } from '../middleware/SquareAPI.js';
import { refreshToken } from '../Controllers/RefreshToken.js';
import { verifyToken } from '../middleware/VerifyToken.js';


const router = express.Router();

// Portfolio Routes
router.get('/users', verifyToken, getUsers);
router.get('/user', verifyToken, getUser);
router.post('/register', Register);
router.post('/login', Login);
router.post('/logout', Logout);
router.get('/token', refreshToken);
router.get('/verify-token', verifyToken, (req, res) => res.sendStatus(200));

// eCommerce Routes
// Products
router.get('/products/get/:id', getProduct);
router.get('/products/getallhistory', getProducts);
router.put('/products/update/:id', updateProduct);
router.post('/products/create', createProduct);
router.delete('/products/delete/:id', deleteProduct);

// Product Reviews (these routes need to be added to your Products controller)
router.post('/products/:id/reviews', async (req, res) => {
  // This would need to be implemented in Products.js
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});
router.put('/products/:id/reviews/:reviewId', async (req, res) => {
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});
router.delete('/products/:id/reviews/:reviewId', async (req, res) => {
  res.status(501).json({ message: "Review endpoints not yet implemented" });
});

// Customers
router.get('/customers/get', getCustomers);
router.get('/customers/get/:id', getCustomer);
router.post('/customers/create', createCustomer);
router.put('/customers/update/:id', updateCustomer); // Fixed: added :id parameter
router.delete('/customers/delete/:id', deleteCustomer); // Added missing delete route

// Transactions
router.get('/transactions/get', getTransactions);
router.get('/transactions/get/:id', getTransaction);
router.post('/transactions/create', createTransaction);
router.put('/transactions/update/:id', updateTransaction); // Fixed: added :id parameter
router.delete('/transactions/delete/:id', deleteTransaction); // Added missing delete route

// Orders
router.get('/orders/get', getOrders);
router.get('/orders/get/:id', getOrder);
router.post('/orders/create', createOrder);
router.put('/orders/update/:id', updateOrder); // Fixed: added :id parameter
router.delete('/orders/delete/:id', deleteOrder);

// Cart Management
router.get('/cart/get/:id/:ipAddress', getCartItems);
router.post('/cart/update/:id/:ipAddress', updateCartItems); // Fixed: added required parameters
router.delete('/cart/delete/:id/:productId/:ipAddress', deleteCartItem); // Fixed: added required parameters

// IP History Management
router.get('/ip-history', getIpHistories);
router.get('/ip-history/:ipAddress', getIpHistory);
router.post('/ip-history/create', createIpHistory);
router.put('/ip-history/update/:ipAddress', updateIpHistory);
router.delete('/ip-history/delete/:ipAddress', deleteIpHistory);

// Square Payment API Routes
router.post('/payments', createPayment);
router.get('/payments/:paymentId', getPayment);
router.put('/payments/:paymentId', updatePayment);
router.delete('/payments/:paymentId', cancelPayment);
router.post('/payments/:paymentId/complete', completePayment);
router.post('/payments/:paymentId/refund', refundPayment);
router.get('/payments', listPayments);
router.get('/square/initialize', initializeSquareClient);

export default router;