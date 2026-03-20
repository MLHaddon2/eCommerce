// ── cookieUtils.js ────────────────────────────────────────────────────────────
// Single source of truth for cookie names and helpers shared across the client.
// Keep COOKIE_KEYS in sync with the server-side COOKIE_KEYS in index.js.

// TODO: Get rid of all the local storage

export const COOKIE_KEYS = {
    SESSION_ID:    'sessionId',
    USER_ID:       'user_id',
    USERNAME:      'username',
    ACCESS_TOKEN:  'access_token',
    REFRESH_TOKEN: 'refresh_token',
};

/**
 * Read a cookie by name.
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
 * Write a cookie.
 * @param {string} name
 * @param {string} value
 * @param {number} days  - defaults to 7 to match server maxAge
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
 * Delete all auth-related cookies in one call.
 */
export const clearAuthCookies = () => {
    deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
    deleteCookie(COOKIE_KEYS.REFRESH_TOKEN);
    deleteCookie(COOKIE_KEYS.USER_ID);
    deleteCookie(COOKIE_KEYS.USERNAME);
};
