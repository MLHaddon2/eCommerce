import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { getCookie, COOKIE_KEYS } from '../Utils/cookieUtils';

const CartContext = createContext();

const normalizeIp = (ip) => ip.replace('::ffff:', '').trim();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------------------------------------------------------
     LOAD CART
  --------------------------------------------------------- */
  const loadCartFromDatabase = async () => {
    try {
      const ipResponse = await axios.get('proxy');
      const ipAddress = normalizeIp(ipResponse.data.ip);
      const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';

      const url =
        userId !== '0000'
          ? `/api/cart/get/${userId}/${ipAddress}`
          : `/api/cart/get/${ipAddress}`;

      const res = await axios.get(url);
      setCartItems(res.data.cartItems || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    }
  };

  /* ---------------------------------------------------------
     SYNC CART
  --------------------------------------------------------- */
  const syncCartWithDatabase = async (items) => {
    const ipResponse = await axios.get('proxy');
    const ipAddress = normalizeIp(ipResponse.data.ip);
    const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';

    const url =
      userId !== '0000'
        ? `/api/cart/update/${userId}/${ipAddress}`
        : `/api/cart/update/${ipAddress}`;

    await axios.post(url, { cartItems: items });
  };

  /* ---------------------------------------------------------
     CART ACTIONS
  --------------------------------------------------------- */

  const addToCart = async (product) => {
    const updated = [...cartItems];
    const existing = updated.find((i) => i.id === product.id);

    if (existing) existing.quantity += 1;
    else updated.push({ ...product, quantity: 1 });

    setCartItems(updated);
    await syncCartWithDatabase(updated);
  };

  const removeFromCart = async (productId) => {
    const updated = cartItems.filter((i) => i.id !== productId);
    setCartItems(updated);
    await syncCartWithDatabase(updated);
  };

  const updateQuantity = async (productId, quantity) => {
    const updated = cartItems.map((i) =>
      i.id === productId ? { ...i, quantity } : i
    );
    setCartItems(updated);
    await syncCartWithDatabase(updated);
  };

  const clearCart = async () => {
    setCartItems([]);
    await syncCartWithDatabase([]);
  };

  /* ---------------------------------------------------------
     CART HELPERS (NEEDED BY HEADER + UI)
  --------------------------------------------------------- */

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartProductIds = () => {
    return cartItems.map((item) => item.id);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loadCartFromDatabase,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
        getCartProductIds,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
