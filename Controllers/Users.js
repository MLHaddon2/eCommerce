import Users from '../models/userModel.js';
import IpHistory from '../models/ipHistoryModel.js';
import Customers from '../models/customerModel.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error),
  });
};

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['id', 'username', 'email', 'lastLogin']
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
      attributes: ['id', 'username', 'email', 'lastLogin']
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

export const Register = async (req, res) => {
  const { username, email, password, confPwd } = req.body;
  if (password !== confPwd) return res.status(400).json({ message: "Passwords do not match" });

  try {
    const salt = await bcrypt.genSalt(10);
    const hashPwd = await bcrypt.hash(password, salt);

    const user = await Users.create({
      username,
      email,
      password: hashPwd,
      lastLogin: new Date().toUTCString()
    });

    const accessToken = jwt.sign(
      { userID: user.id, username: user.username, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userID: user.id, username: user.username, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await Users.update({ refresh_token: refreshToken }, {
      where: { id: user.id }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(201).json({ accessToken, userID: user.id, username: user.username });
  } catch (error) {
    return handleError(res, 'Register', error);
  }
};

export const Login = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { username: req.body.username }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    const accessToken = jwt.sign(
      { userID: user.id, username: user.username, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userID: user.id, username: user.username, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await Users.update({ refresh_token: refreshToken }, {
      where: { id: user.id }
    });

    const cookieConfig = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    };

    // Set both tokens as httpOnly cookies so the client never handles raw tokens
    res.cookie('refreshToken', refreshToken, { ...cookieConfig, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('access_token', accessToken, { ...cookieConfig, maxAge: 15 * 60 * 1000 });

    // Return the access token in the body too so AuthContext can set the
    // Authorization header for the remainder of this session without a page reload
    const userRes = { id: user.id, username: user.username, email: user.email };
    res.status(200).json({ message: "Login Successful", accessToken, userRes });

    // Record IP — runs after response is sent so it never delays the login reply
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (ip) {
      const now = new Date();

      // 1. Upsert the standalone IpHistory table
      const [ipRow] = await IpHistory.findOrCreate({
        where: { ipAddress: ip },
        defaults: { ipAddress: ip, userId: String(user.id), lastLogin: now, cartItems: [] }
      });
      if (ipRow.userId !== String(user.id) || ipRow.lastLogin !== now) {
        await ipRow.update({ userId: String(user.id), lastLogin: now });
      }

      // 2. Append IP to the matching Customer row's ipHistory JSON array
      const customer = await Customers.findOne({ where: { email: user.email } });
      if (customer) {
        const existing = Array.isArray(customer.ipHistory) ? customer.ipHistory : [];
        if (!existing.includes(ip)) {
          await customer.update({ ipHistory: [...existing, ip] });
        }
      }
    }
  } catch (error) {
    return handleError(res, 'Login', error);
  }
};

export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const user = await Users.findOne({ where: { refresh_token: refreshToken } });
      if (user) {
        await Users.update({ refresh_token: null }, { where: { id: user.id } });
      }
    }

    // Clear both auth cookies — only the server can clear httpOnly cookies
    res.clearCookie('refreshToken');
    res.clearCookie('access_token');
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, 'Logout', error);
  }
};