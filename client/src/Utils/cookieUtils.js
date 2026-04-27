// ── cookieUtils.js ────────────────────────────────────────────────────────────
// Single source of truth for cookie names and helpers shared across the client.
//
// FIXED — auth cookie strategy:
// The server sets httpOnly: true cookies (access_token, session, user_id).
// httpOnly cookies are INVISIBLE to document.cookie by design — they are sent
// automatically by the browser on every request but JS cannot read them.
// Trying to read them with getCookie() always returns null/undefined.
//
// Strategy going forward:
//   - httpOnly cookies (set by server): access_token, sessionId, user_id
//     → Never read these in JS. The browser handles them automatically.
//     → Auth state is determined by calling /api/verify-token on load,
//       not by reading the token directly.
//   - JS-readable cookies (set by client): username only — just for display.
//     → Nothing sensitive. Losing this cookie only means the welcome
//       message disappears until next login, which is fine.

export const COOKIE_KEYS = {
    SESSION_ID:    'sessionId',     // httpOnly — set by server, do not read in JS
    USER_ID:       'user_id',       // JS-readable — written by client after login
    ACCESS_TOKEN:  'access_token',  // httpOnly — set by server, do not read in JS
    REFRESH_TOKEN: 'refresh_token', // httpOnly — set by server, do not read in JS
    USERNAME:      'username',      // JS-readable — safe to store, not sensitive
    IS_AUTHENTICATED: 'isAuthenticated', // JS-readable — for auth status
};

/**
 * Read a JS-readable cookie by name.
 * NOTE: This will always return null for httpOnly cookies (access_token,
 * user_id, sessionId) — that is expected and correct behaviour.
 * @param {string} name
 * @returns {string|null}
 */
export const getCookie = (name) => {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Write a JS-readable cookie. Only use for non-sensitive display data.
 * @param {string} name
 * @param {string} value
 * @param {number} days — defaults to 7
 */
export const setCookie = (name, value, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

/**
 * Delete a cookie by name.
 * @param {string} name
 */
export const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

/**
 * Clear the only JS-readable auth cookie (username).
 * The httpOnly cookies (token, user_id, sessionId) are cleared by the server
 * when it receives the logout request — the client cannot clear them directly.
 */
export const clearAuthCookies = () => {
    deleteCookie(COOKIE_KEYS.ISAUTHENTICATED);
    deleteCookie(COOKIE_KEYS.USERNAME);
    deleteCookie(COOKIE_KEYS.USER_ID);
};
