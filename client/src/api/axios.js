import axios from 'axios';

// baseURL comes from REACT_APP_API_URL (client/.env.development locally,
// client/.env.production for deployed builds). Without it, production builds call
// their own origin (Express serves client/build in production) and dev calls :5001.
//
// withCredentials: true is required — without it the browser silently drops all
// Set-Cookie headers from cross-origin responses (client on :3000, server on :5001),
// so the httpOnly auth/session cookies are never stored or sent back.
const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL
        ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001'),
    withCredentials: true,
});

export default instance;

// Must set the header on the exported instance, not the global axios defaults —
// every request in the app goes through this instance.
export const setAuthToken = token => {
    if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete instance.defaults.headers.common['Authorization'];
    }
};

// ── Silent session refresh ────────────────────────────────────────────────────
// Access tokens last 15 minutes. When a request comes back 401, ask the server for
// a new one using the httpOnly refresh cookie, then retry the original request once.
// Concurrent 401s share a single refresh call.
const NO_REFRESH_URLS = ['/api/token', '/api/login', '/api/register', '/api/logout'];
let refreshPromise = null;

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;
        const url = original?.url || '';

        if (status !== 401 || !original || original._retry || NO_REFRESH_URLS.some((u) => url.includes(u))) {
            return Promise.reject(error);
        }

        original._retry = true;
        try {
            refreshPromise = refreshPromise || instance.get('/api/token').finally(() => { refreshPromise = null; });
            const { data } = await refreshPromise;
            setAuthToken(data.accessToken);
            original.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return instance(original);
        } catch {
            setAuthToken(null);
            return Promise.reject(error);
        }
    }
);
