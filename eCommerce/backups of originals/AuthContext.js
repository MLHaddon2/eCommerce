import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCart } from './CartContext';
import axios from '../api/axios';
import {
  COOKIE_KEYS,
  setCookie,
  clearAuthCookies,
} from '../Utils/cookieUtils';

// FIXED — cookie strategy overhaul:
//
// BEFORE (broken):
//   - login() called setCookie(ACCESS_TOKEN, token) to store the token in a
//     JS-readable cookie, but the server was ALSO setting the same token as an
//     httpOnly cookie. Two copies, one invisible to JS.
//   - checkAuthStatus() called getCookie(ACCESS_TOKEN) which always returned
//     null because the server's copy is httpOnly and invisible to document.cookie.
//   - Result: every page refresh logged the user out silently.
//
// AFTER (fixed):
//   - The server's httpOnly cookies (access_token, user_id, sessionId) are the
//     single source of truth. The client never tries to read or write them.
//   - withCredentials: true on the axios instance means the browser automatically
//     sends these httpOnly cookies on every API request.
//   - checkAuthStatus() calls GET /api/verify-token. The browser sends the httpOnly
//     token cookie automatically — the server validates it and returns the user.
//     No token reading in JS required.
//   - login() stores only username in a JS-readable cookie (for the welcome message).
//   - logout() calls POST /api/logout so the server can clear its httpOnly cookies.
//     The client clears only the username cookie it owns.

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const { loadCartFromDatabase, cartItems } = useCart();

  // On mount, check if the user is still authenticated by hitting verify-token.
  // The browser sends the httpOnly access_token cookie automatically — we never
  // need to read it in JS. The server returns the user object if the token is valid.
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/verify-token');
        const { user } = response.data;

        if (user) {
          setIsAuthenticated(true);
          setUsername(user.username);
          setUserId(user.id);
          setCookie(COOKIE_KEYS.USERNAME, user.username);
          setCookie(COOKIE_KEYS.USER_ID, String(user.id));
          await loadCartFromDatabase(user.id);
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Error verifying token:', error);
        }
        handleClearAuthData();
      }
    };

    checkAuthStatus();
  }, []);

  const handleClearAuthData = () => {
    clearAuthCookies(); // clears username and user_id JS-readable cookies
    setIsAuthenticated(false);
    setUsername(null);
    setUserId(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = async (credentials) => {
    try {
      const { token, user } = credentials;

      setCookie(COOKIE_KEYS.USERNAME, user.username);
      setCookie(COOKIE_KEYS.USER_ID, String(user.id));

      setIsAuthenticated(true);
      setUsername(user.username);
      setUserId(user.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await loadCartFromDatabase(user.id);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      // Tell the server to clear its httpOnly cookies (access_token, sessionId).
      // The client cannot clear httpOnly cookies directly — only the server can.
      await axios.post('api/logout', {
        cartItems: cartItems,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear client-side state even if the server call fails
      handleClearAuthData();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
