import Users from '../models/userModel.js';
import IpHistory from '../models/ipHistoryModel.js';
import Customers from '../models/customerModel.js';
import bcrypt from "bcrypt";
import { handleError } from '../utils/handleError.js';
import { mergeGuestCart } from './Cart.js';
import {
  signAccessToken,
  signRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  publicUser,
  hashToken
} from '../utils/authTokens.js';

export const MIN_PASSWORD_LENGTH = 8;

// Issues both tokens, stores the refresh token, and sets both httpOnly cookies.
export const startSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await Users.update({ refresh_token: hashToken(refreshToken) }, { where: { id: user.id } });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
  return accessToken;
};

// req.ip is the real client IP when 'trust proxy' is set in index.js.
const clientIp = (req) => (req.ip || '').replace('::ffff:', '').trim();

// Records the login IP in the IpHistory table and on the user's Customer row.
const recordLogin = async (req, user) => {
  const ip = clientIp(req);
  const now = new Date();

  if (ip) {
    const [ipRow] = await IpHistory.findOrCreate({
      where: { ipAddress: ip },
      defaults: { ipAddress: ip, userId: String(user.id), lastLogin: now, cartItems: [] }
    });
    await ipRow.update({ userId: String(user.id), lastLogin: now });
  }

  const customer = await Customers.findOne({ where: { email: user.email } });
  if (customer) {
    const existing = Array.isArray(customer.ipHistory) ? customer.ipHistory : [];
    await customer.update({
      lastLogin: now.toUTCString(),
      ipHistory: ip && !existing.includes(ip) ? [...existing, ip] : existing
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['id', 'username', 'email', 'lastLogin', 'isAdmin']
    });
    res.json(users);
  } catch (error) {
    return handleError(res, 'Get users', error);
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { id: req.userID },
      attributes: ['id', 'username', 'email', 'lastLogin', 'isAdmin']
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    await Users.update({ lastLogin: new Date().toUTCString() }, {
      where: { id: req.userID }
    });
    res.json(user);
  } catch (error) {
    return handleError(res, 'Get user', error);
  }
};

// Creates the login (users row) and the shop profile (customers row) together.
// The two are linked by email. New accounts are never admins.
export const Register = async (req, res) => {
  const { username, email, password, confPwd, firstName, lastName, address } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email and password are required" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (password !== confPwd) return res.status(400).json({ message: "Passwords do not match" });

  try {
    const taken = await Users.findOne({ where: { username } });
    if (taken) return res.status(409).json({ message: "Username is already taken" });

    const emailTaken = await Users.findOne({ where: { email } });
    if (emailTaken) return res.status(409).json({ message: "An account with that email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashPwd = await bcrypt.hash(password, salt);

    const user = await Users.create({
      username,
      email,
      password: hashPwd,
      lastLogin: new Date().toUTCString()
    });

    const existingCustomer = await Customers.findOne({ where: { email } });
    if (!existingCustomer) {
      await Customers.create({
        firstName,
        lastName,
        email,
        address,
        cartItems: [],
        ipHistory: [],
        totalOrders: 0,
        totalSpent: 0,
        lastLogin: new Date().toUTCString()
      });
    }

    const accessToken = await startSession(res, user);
    await mergeGuestCart(req.cookies?.sessionId, user.email);
    res.status(201).json({ accessToken, user: publicUser(user) });
  } catch (error) {
    return handleError(res, 'Register', error);
  }
};

export const Login = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { username: req.body.username }
    });

    // Same response for unknown user and wrong password, so the login form
    // can't be used to discover which usernames exist.
    const match = user && await bcrypt.compare(req.body.password || '', user.password);
    if (!match) return res.status(401).json({ message: "Incorrect username or password" });

    const accessToken = await startSession(res, user);
    await mergeGuestCart(req.cookies?.sessionId, user.email);
    res.status(200).json({ message: "Login Successful", accessToken, user: publicUser(user) });

    // Runs after the response is sent so it never delays the login reply.
    recordLogin(req, user).catch((error) => console.error('Record login failed:', error));
  } catch (error) {
    return handleError(res, 'Login', error);
  }
};

export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await Users.update({ refresh_token: null }, { where: { refresh_token: hashToken(refreshToken) } });
    }

    // Only the server can clear httpOnly cookies.
    clearAuthCookies(res);
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, 'Logout', error);
  }
};
