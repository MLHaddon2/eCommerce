import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';
import axios from '../api/axios';

// TODO: Implement cookies for local storage states

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Initialize cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { deleteIpHistory, updateIpHistory, createIpHistory, getIpHistory, getIpHistories } = useData();

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  const addToCart = async (product) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const newCartItems = [...cartItems];
        const existingItem = newCartItems.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            newCartItems.push({ ...product, quantity: 1 });
        }
        
        setCartItems(newCartItems);
        
        // Sync with database
        await syncCartWithDatabase(newCartItems);
      } catch (error) {
        setError('Failed to add item to cart');
        console.error('Error adding product to cart:', error);
      } finally {
        setIsLoading(false);
      }
  };

  const syncCartWithDatabase = async (cartItems) => {
      try {
          // const userId = localStorage.getItem('user_id') || '0000';
          const lastLogin = new Date().toUTCString();
          const ipResponse = await axios.get('proxy');
          const ipAddress = ipResponse.data.ip;

          // Check for IP Address and create one if not exists
          const ipHistories = await getIpHistories();
          const ipHistory = ipHistories.find(history => history.ipAddress === ipAddress);

          !ipHistory ? await createIpHistory({ipAddress, lastLogin, cartItems})
            :
          await updateIpHistory(ipHistory.id, {ipAddress, lastLogin, cartItems});
      } catch (error) {
        console.error('Error syncing cart with database:', error);
      }
  };

  const removeFromCart = async (productId) => {
      const newCartItems = cartItems.filter(item => item.id !== productId);
      setCartItems(newCartItems);
      
      try {
          // const userId = localStorage.getItem('user_id') || '0000';
          const ipResponse = await axios.get('proxy');
          const ipAddress = ipResponse.data.ip;
          
          await deleteIpHistory(productId, ipAddress);
      } catch (error) {
          console.error('Error removing product from cart:', error);
      }
  };

  const loadCartFromDatabase = async (userId) => {
    try {
        if (userId) {
          // Logged-in user — load cart from their customer record
          const res = await axios.get(`/api/cart/get/${userId}/none`);
          console.log({ message: 'LoadFromCart (user) Response: ', res });
          if (res?.data?.customer?.cartItems) {
            setCartItems(res.data.customer.cartItems);
          }
        } else {
          // Guest — load cart from IP history
          const ipResponse = await axios.get('proxy');
          const ipAddress = ipResponse.data.ip;
          const res = await getIpHistory(ipAddress);
          console.log({ message: 'LoadFromCart (guest) Response: ', res });
          if (res && res.cartItems) {
            setCartItems(res.cartItems);
          }
        }
    } catch (error) {
        console.error('Error loading cart from database:', error);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartProductIds = () => {
    return console.log(cartItems.map(item => item.id));
  };
  
  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      getCartProductIds,
      loadCartFromDatabase,
      isLoading,
      error
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
