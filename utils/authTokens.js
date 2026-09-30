import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'node:crypto';

// Single place that decides what goes into a token and how long it lives.
// Login, Register and the refresh endpoint all go through here so they can't drift apart.
export const ACCESS_TOKEN_TTL_MS  = 15 * 60 * 1000;           // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days

const tokenPayload = (user) => ({
  userID:   user.id,
  username: user.username,
  email:    user.email,
  isAdmin:  Boolean(user.isAdmin)
});

export const signAccessToken = (user) =>
  jwt.sign(tokenPayload(user), process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_MS / 1000
  });

// jwtid makes every refresh token unique — otherwise two signed in the same second are
// identical, and "rotating" it (password change, re-login) wouldn't invalidate the old one.
export const signRefreshToken = (user) =>
  jwt.sign(tokenPayload(user), process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_MS / 1000,
    jwtid: randomUUID()
  });

// The users.refresh_token column stores this hash, never the token itself: it fits in
// VARCHAR(255) (a full token is ~340 chars), and a leaked database row can't be replayed.
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const authCookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path:     '/'
});

export const setAccessCookie = (res, accessToken) =>
  res.cookie('access_token', accessToken, { ...authCookieOptions(), maxAge: ACCESS_TOKEN_TTL_MS });

export const setRefreshCookie = (res, refreshToken) =>
  res.cookie('refreshToken', refreshToken, { ...authCookieOptions(), maxAge: REFRESH_TOKEN_TTL_MS });

export const clearAuthCookies = (res) => {
  res.clearCookie('access_token', authCookieOptions());
  res.clearCookie('refreshToken', authCookieOptions());
};

// The user object the client is allowed to see.
export const publicUser = (user) => ({
  id:       user.id,
  username: user.username,
  email:    user.email,
  isAdmin:  Boolean(user.isAdmin)
});
