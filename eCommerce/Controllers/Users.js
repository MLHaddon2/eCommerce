import Users from '../models/userModel.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['id', 'username', 'email', 'lastLogin']
    });
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: "Internal server error" });
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
    console.error('Error in getUser:', error);
    res.status(500).json({ message: "Internal server error" });
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
    console.error('Error in Register:', error);
    res.status(500).json({ message: "Error creating user" });
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

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({message:"Login Successful", accessToken, userRes: user });
  } catch (error) {
    console.error('Error in Login:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);

    const user = await Users.findOne({
      where: { refresh_token: refreshToken }
    });

    if (!user) {
      res.clearCookie('refreshToken');
      return res.sendStatus(204);
    }

    await Users.update({ refresh_token: null }, {
      where: { id: user.id }
    });
    
    res.clearCookie('refreshToken');
    res.sendStatus(200);
  } catch (error) {
    console.error('Error in Logout:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};