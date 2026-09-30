import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useCart } from './CartContext';
import axios, { setAuthToken } from '../api/axios';
import { clearAuthCookies } from '../Utils/cookieUtils';

// Auth state comes from the server, never from JS-readable cookies:
//   - The server's httpOnly cookies (access_token, refreshToken) are the source of truth;
//     the browser sends them automatically (withCredentials in api/axios.js).
//   - On load we call GET /api/session, which returns the user (renewing an expired
//     access cookie from the refresh cookie) or null for guests.
//   - isAdmin comes from the signed token (users.isAdmin). It only controls what the UI
//     shows — the server enforces admin access on every admin route.
//   - authChecked is false until the first session check finishes, so pages like
//     AdminPanel can wait for it instead of polling.

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { loadCartFromDatabase } = useCart();

  const applyUser = useCallback((nextUser, token) => {
    setUser(nextUser);
    setAuthToken(nextUser ? token : null);
    if (!nextUser) clearAuthCookies();
  }, []);

  // On mount: restore the session (if any), then load the right cart —
  // the customer cart when logged in, otherwise the guest session cart.
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Always 200: { user } when logged in (the server renews an expired access
        // cookie itself), { user: null } for guests — so guests see no 401s.
        const response = await axios.get('/api/session');
        applyUser(response.data.user || null, response.data.accessToken);
      } catch (error) {
        console.error('Error checking session:', error);
        applyUser(null);
      } finally {
        setAuthChecked(true);
        await loadCartFromDatabase();
      }
    };

    checkAuthStatus();
    // Run once on mount; login/logout update state directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called by Login/Signup after a successful POST. The server has already set the
  // httpOnly cookies and merged any guest cart into the customer cart.
  const login = async ({ token, user: loggedInUser }) => {
    applyUser(loggedInUser, token);
    await loadCartFromDatabase();
  };

  // Called after the server re-issues tokens (username/password change on the Account page).
  const updateSession = ({ token, user: updatedUser }) => {
    applyUser(updatedUser, token);
  };

  const logout = async () => {
    try {
      // Only the server can clear httpOnly cookies.
      await axios.post('/api/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear client-side state even if the server call fails
      applyUser(null);
      await loadCartFromDatabase();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user?.isAdmin),
        username: user?.username || null,
        userId: user?.id || null,
        authChecked,
        login,
        logout,
        updateSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
