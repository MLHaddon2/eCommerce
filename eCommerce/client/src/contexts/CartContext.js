import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';
import axios from '../api/axios';
import { getCookie, COOKIE_KEYS } from '../Utils/cookieUtils';

const CartContext = createContext();

const getPersistedCart = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.warn('Could not parse persisted cart from localStorage:', error);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => getPersistedCart());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateIpHistory, createIpHistory, getIpHistory, getIpHistories } = useData();

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

  const syncCartWithDatabase = async (cartItemsToSync) => {
      try {
          const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';
          const ipResponse = await axios.get('proxy');
          const ipAddress = ipResponse.data.ip;

          await axios.post(`/api/cart/update/${userId}/${ipAddress}`, {
            cartItems: cartItemsToSync,
          });
      } catch (error) {
        console.error('Error syncing cart with database:', error);
      }
  };
 
  const removeFromCart = async (productId) => {
    try {
      const newCartItems = cartItems.filter(item => item.id !== productId);
      setCartItems(newCartItems);
      await syncCartWithDatabase(newCartItems);
    } catch (error) {
      console.error('Error removing product from cart:', error);
    }
  };

  const loadCartFromDatabase = async (userId) => {
    try {
        const persistedCart = getPersistedCart();
        const ipResponse = await axios.get('proxy');
        const ipAddress = ipResponse.data.ip;

        if (userId) {
          try {
            const res = await axios.get(`/api/cart/get/${userId}/${ipAddress}`);
            const remoteCart = res?.data?.cartItems || [];
            if (remoteCart.length > 0) {
              setCartItems(remoteCart);
            } else if (persistedCart.length > 0) {
              setCartItems(persistedCart);
              await syncCartWithDatabase(persistedCart);
            }
          } catch (error) {
            if (error.response?.status === 404 && persistedCart.length > 0) {
              setCartItems(persistedCart);
              await syncCartWithDatabase(persistedCart);
            } else {
              console.error('Error loading user cart:', error);
            }
          }
        } else {
          try {
            const res = await axios.get(`/api/cart/get/${ipAddress}`);
            const remoteCart = res?.data?.cartItems || [];
            if (remoteCart.length > 0) {
              setCartItems(remoteCart);
            } else if (persistedCart.length > 0) {
              setCartItems(persistedCart);
              await syncCartWithDatabase(persistedCart);
            }
          } catch (error) {
            if (error.response?.status === 404) {
              if (persistedCart.length > 0) {
                setCartItems(persistedCart);
                await syncCartWithDatabase(persistedCart);
              } else {
                await createIpHistory({ ipAddress, lastLogin: null, cartItems: [] });
              }
            } else {
              console.error('Error loading guest cart:', error);
            }
          }
        }
    } catch (error) {
        console.error('Error loading cart from database:', error);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    const newCartItems = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
    );
    setCartItems(newCartItems);
    await syncCartWithDatabase(newCartItems);
  };

  const clearCart = async () => {
    setCartItems([]);
    await syncCartWithDatabase([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartProductIds = () => {
    return cartItems.map(item => item.id);
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
      syncCartWithDatabase,
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
