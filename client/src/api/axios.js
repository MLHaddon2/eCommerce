import axios from 'axios';

// FIXED:
// Added withCredentials: true — without this the browser silently drops all
// Set-Cookie headers from cross-origin responses (client on :3000, server on :5001).
// This flag tells the browser to include cookies on every request and accept
// cookies from every response, which is required for the httpOnly session cookie
// set by the server to actually be stored and sent back.

const instance = axios.create({
    baseURL: 'http://localhost:5001',
    withCredentials: true,
});

export default instance;

export const setAuthToken = token => {
    if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete instance.defaults.headers.common['Authorization'];
    }
};
