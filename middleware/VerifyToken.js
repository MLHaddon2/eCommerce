import jwt from 'jsonwebtoken';

// Security note: consider adding token revocation/rotation if your app supports logout
// or password resets, e.g., a token blacklist, refresh-token version fields, or per-user token version.

const getTokenFromAuthHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;

  const header = authHeader.trim();
  if (!header) return null;

  const parts = header.split(/\s+/);

  // Case 1: "Bearer <token>", "Token <token>", "JWT <token>", etc.
  if (parts.length > 1) {
    return parts.slice(1).join(' ');
  }

  // Case 2: raw token passed as `Authorization: <token>`
  return parts[0];
};

// Authorization header first (set by axios after login in the same session),
// then the httpOnly access_token cookie (used on page reload).
const getRequestToken = (req) =>
  getTokenFromAuthHeader(req.headers['authorization']) || req.cookies?.access_token;

const attachUser = (req, decoded) => {
  req.userID   = decoded.userID;
  req.username = decoded.username;
  req.email    = decoded.email;
  req.isAdmin  = decoded.isAdmin === true;
};

export const verifyToken = (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });
    attachUser(req, decoded);
    next();
  });
};

// Admin-only routes. isAdmin comes from the signed JWT, which is issued from the
// users.isAdmin column — it can't be forged from the browser the way a cookie can.
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!req.isAdmin) return res.status(403).json({ message: "Admin access required" });
    next();
  });
};

// For routes that work for both guests and logged-in users (e.g. the cart).
// Attaches the user when a valid token is present, otherwise carries on as a guest.
export const optionalAuth = (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) return next();

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (!err) attachUser(req, decoded);
    next();
  });
};
