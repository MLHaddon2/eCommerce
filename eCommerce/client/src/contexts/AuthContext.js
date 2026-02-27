import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCart } from './CartContext';
import axios from '../api/axios';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  // const [isECommerce, setECommerce] = useState(false);
  const { loadCartFromDatabase } = useCart();
  const { cartItems } = useCart();

  
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const response = await axios.get('/api/verify-token', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("response: ", response);
          if (response.config.headers.Authorization) {
            setIsAuthenticated(true);
            setUsername(localStorage.getItem('username'));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
          // Clear Auth Data
          clearAuthData();
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // Clear Auth Data
          clearAuthData();
        }
      }
    };
    
    checkAuthStatus();
    }, []);
  
  const clearAuthData = () => {
    console.log('Authorization cleared!!!')
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(null);
    delete axios.defaults.headers.common['Authorization'];
  };
  
  const login = async (credentials) => {
    try {
      // Set user data
      setIsAuthenticated(true);
      setUsername(credentials.user.username);
      localStorage.setItem('access_token', credentials.token);
      localStorage.setItem('username', credentials.user.username);
      localStorage.setItem('user_id', credentials.user.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${credentials.token}`;
      
      // Load user's cart from database
      await loadCartFromDatabase(credentials.user.id);
      
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
      
      // Clear user data
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      delete axios.defaults.headers.common['Authorization'];
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
