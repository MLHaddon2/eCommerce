// ── cookieUtils.js ────────────────────────────────────────────────────────────
// Cookie names and helpers shared across the client.
//
// Auth strategy:
//   - The server sets httpOnly cookies (access_token, refreshToken, sessionId).
//     These are INVISIBLE to document.cookie by design — the browser sends them
//     automatically on every request (withCredentials in api/axios.js).
//   - Who the user is, and whether they're an admin, comes from the server via
//     /api/verify-token and lives in AuthContext. Never decide auth from a
//     JS-readable cookie — anyone can edit those in devtools.

export const COOKIE_KEYS = {
    SESSION_ID:    'sessionId',     // httpOnly — set by server
    ACCESS_TOKEN:  'access_token',  // httpOnly — set by server
    REFRESH_TOKEN: 'refreshToken',  // httpOnly — set by server
};

// JS-readable cookies written by older versions of the app. Cleared on logout /
// failed auth so stale values don't linger in users' browsers.
const LEGACY_COOKIES = ['username', 'user_id', 'isAuthenticated'];

/**
 * Read a JS-readable cookie by name.
 * NOTE: Always returns null for httpOnly cookies — that is expected.
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
 * Clear JS-readable auth cookies left by older versions of the app.
 * The httpOnly cookies are cleared by the server on POST /api/logout.
 */
export const clearAuthCookies = () => {
    LEGACY_COOKIES.forEach(deleteCookie);
};
