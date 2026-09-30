import Users from "../models/userModel.js";
import jwt from 'jsonwebtoken';
import { handleError } from '../utils/handleError.js';
import { signAccessToken, setAccessCookie, publicUser, hashToken } from '../utils/authTokens.js';

// Issues a new access token from the httpOnly refresh cookie. The client's axios
// interceptor calls this automatically when a request comes back 401.
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token not found" });

    const user = await Users.findOne({
      where: { refresh_token: hashToken(refreshToken) }
    });

    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err) => {
      if (err) return res.status(401).json({ message: "Invalid refresh token" });

      // Re-read from the users row (not the old token) so a changed
      // isAdmin flag takes effect on the next refresh.
      const accessToken = signAccessToken(user);
      setAccessCookie(res, accessToken);
      res.json({ accessToken, user: publicUser(user) });
    });
  } catch (error) {
    return handleError(res, 'Refresh token', error);
  }
};

// Returns the user for a valid refresh cookie, or null. Never throws for bad tokens.
const userFromRefreshCookie = async (req) => {
  const token = req.cookies.refreshToken;
  if (!token) return null;
  try {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return null;
  }
  return Users.findOne({ where: { refresh_token: hashToken(token) } });
};

// GET /api/session — what the client calls on page load. Always 200:
//   { user, accessToken } when logged in (renewing an expired access cookie from the
//   refresh cookie if needed), or { user: null } for guests. Unlike /api/verify-token,
//   a guest visit doesn't produce 401 errors in the browser console.
// Runs behind optionalAuth, which sets req.userID when the access token is valid.
export const getSession = async (req, res) => {
  try {
    if (req.userID) {
      const user = await Users.findByPk(req.userID);
      if (user) return res.json({ user: publicUser(user) });
    }

    const user = await userFromRefreshCookie(req);
    if (!user) return res.json({ user: null });

    const accessToken = signAccessToken(user);
    setAccessCookie(res, accessToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    return handleError(res, 'Get session', error);
  }
};
