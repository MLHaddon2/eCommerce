import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCart } from './CartContext';
import axios from '../api/axios';
import {
  COOKIE_KEYS,
  getCookie,
  setCookie,
  clearAuthCookies,
} from '../Utils/cookieUtils';

// TODO: Get rid of all the local storage

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const { loadCartFromDatabase, cartItems } = useCart();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN);

      if (token) {
        try {
          const response = await axios.get('/api/verify-token', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.config.headers.Authorization) {
            setIsAuthenticated(true);
            setUsername(getCookie(COOKIE_KEYS.USERNAME));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            handleClearAuthData();
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          handleClearAuthData();
        }
      }
    };

    checkAuthStatus();
  }, []);

  const handleClearAuthData = () => {
    clearAuthCookies();
    setIsAuthenticated(false);
    setUsername(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = async (credentials) => {
    try {
      const { token, user } = credentials;

      // Persist auth data to cookies
      setCookie(COOKIE_KEYS.ACCESS_TOKEN, token);
      setCookie(COOKIE_KEYS.USERNAME, user.username);
      setCookie(COOKIE_KEYS.USER_ID, String(user.id));

      // Update app state
      setIsAuthenticated(true);
      setUsername(user.username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Load user's cart from database
      await loadCartFromDatabase(user.id);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      // Save current cart to IP history before logging out
      const ipResponse = await axios.get('proxy');
      const ipAddress = ipResponse.data.ip;

      await axios.post(`api/cart/update/0000/${ipAddress}`, {
        cartItems: cartItems
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear auth data even if the cart save fails
      handleClearAuthData();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
