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

export const verifyToken = (req, res, next) => {
  // Try Authorization header first (set by axios after login in the same session),
  // then fall back to the httpOnly access_token cookie (used on page reload).
  const authHeader = req.headers['authorization'];
  const token = getTokenFromAuthHeader(authHeader) || req.cookies?.access_token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.userID = decoded.userID;
    req.username = decoded.username;
    req.email = decoded.email;
    next();
  });
};
