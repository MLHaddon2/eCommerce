import Customers from '../models/customerModel.js';
import Orders from '../models/orderModel.js';
import Users from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { handleError } from '../utils/handleError.js';
import { publicUser } from '../utils/authTokens.js';
import { startSession, MIN_PASSWORD_LENGTH } from './Users.js';

// Self-service endpoints for the logged-in user. All run behind verifyToken and
// only ever touch the customer row linked to the token's email — the admin CRUD
// routes under /api/customers and /api/orders are admin-only.

const PROFILE_FIELDS = ['id', 'firstName', 'lastName', 'email', 'address', 'totalOrders', 'totalSpent', 'lastLogin'];

const findMyCustomer = (req, attributes) =>
  Customers.findOne({ where: { email: req.email }, attributes });

// GET /api/me/customer
export const getMyCustomer = async (req, res) => {
  try {
    const customer = await findMyCustomer(req, PROFILE_FIELDS);
    if (!customer) return res.status(404).json({ message: "Customer profile not found" });
    res.status(200).json({ customer });
  } catch (error) {
    return handleError(res, 'Get my profile', error);
  }
};

// PUT /api/me/customer — only name and address. Email is the link to the login
// account, and totals/history are server-managed, so none of those are editable here.
export const updateMyCustomer = async (req, res) => {
  try {
    const customer = await findMyCustomer(req);
    if (!customer) return res.status(404).json({ message: "Customer profile not found" });

    const updates = {};
    for (const field of ['firstName', 'lastName', 'address']) {
      if (typeof req.body[field] === 'string') updates[field] = req.body[field].trim();
    }

    await customer.update(updates);
    const { id, firstName, lastName, email, address } = customer;
    res.status(200).json({ message: "Profile updated", customer: { id, firstName, lastName, email, address } });
  } catch (error) {
    return handleError(res, 'Update my profile', error);
  }
};

// GET /api/me/orders
export const getMyOrders = async (req, res) => {
  try {
    const customer = await findMyCustomer(req, ['id']);
    if (!customer) return res.status(200).json([]);

    const orders = await Orders.findAll({
      where: { customerId: customer.id },
      order: [['orderDate', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    return handleError(res, 'Get my orders', error);
  }
};

// Both credential changes require the current password, then start a fresh session
// (new access + refresh token). Starting a new session replaces the stored refresh
// token, which logs out any other device using the old one.
const checkCurrentPassword = async (req, res) => {
  const user = await Users.findByPk(req.userID);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return null;
  }
  const ok = await bcrypt.compare(String(req.body.currentPassword || ''), user.password);
  if (!ok) {
    // 400, not 401: the client treats 401 as "session expired" and would try to refresh.
    res.status(400).json({ message: "Current password is incorrect" });
    return null;
  }
  return user;
};

// PUT /api/me/password  { currentPassword, newPassword }
export const changeMyPassword = async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const user = await checkCurrentPassword(req, res);
    if (!user) return;

    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    const accessToken = await startSession(res, user);
    res.status(200).json({ message: "Password updated", accessToken, user: publicUser(user) });
  } catch (error) {
    return handleError(res, 'Change password', error);
  }
};

// PUT /api/me/username  { currentPassword, username }
export const changeMyUsername = async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: "Username must be 3–50 characters" });
    }

    const user = await checkCurrentPassword(req, res);
    if (!user) return;

    if (username !== user.username) {
      const taken = await Users.findOne({ where: { username } });
      if (taken) return res.status(409).json({ message: "Username is already taken" });
      await user.update({ username });
    }

    // The username is inside the token, so issue new ones.
    const accessToken = await startSession(res, user);
    res.status(200).json({ message: "Username updated", accessToken, user: publicUser(user) });
  } catch (error) {
    return handleError(res, 'Change username', error);
  }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PUT /api/me/email  { currentPassword, email }
// The email links the login (users) to the shop profile (customers), so both rows
// change together in one transaction. New tokens are issued because the email is in them.
export const changeMyEmail = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(email) || email.length > 255) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await checkCurrentPassword(req, res);
    if (!user) return;

    if (email === String(user.email).toLowerCase()) {
      return res.status(400).json({ message: "That's already your email address" });
    }
    if (await Users.findOne({ where: { email } }) || await Customers.findOne({ where: { email } })) {
      return res.status(409).json({ message: "That email address is already in use" });
    }

    const oldEmail = user.email;
    await Users.sequelize.transaction(async (transaction) => {
      await user.update({ email }, { transaction });
      await Customers.update({ email }, { where: { email: oldEmail }, transaction });
    });

    const accessToken = await startSession(res, user);
    res.status(200).json({ message: "Email updated", accessToken, user: publicUser(user) });
  } catch (error) {
    return handleError(res, 'Change email', error);
  }
};
