import React, { createContext, useContext, useState } from 'react';
import axios from '../api/axios';

const CartContext = createContext();

// The server decides whose cart this is: the logged-in customer's cart when the
// auth cookie is valid, otherwise the guest cart for the httpOnly sessionId cookie.
// The client never sends a user id or IP address.

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------------------------------------------------------
     LOAD CART
  --------------------------------------------------------- */
  const loadCartFromDatabase = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/cart');
      setCartItems(Array.isArray(res.data.cartItems) ? res.data.cartItems : []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------------------------------
     SYNC CART
  --------------------------------------------------------- */
  const syncCartWithDatabase = async (items) => {
    try {
      await axios.put('/api/cart', { cartItems: items });
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  /* ---------------------------------------------------------
     CART ACTIONS
  --------------------------------------------------------- */

  const addToCart = async (product) => {
    const existing = cartItems.find((i) => i.id === product.id);
    const updated = existing
      ? cartItems.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      : [...cartItems, { ...product, quantity: 1 }];

    setCartItems(updated);
    await syncCartWithDatabase(updated);
  };

  const removeFromCart = async (productId) => {
    const updated = cartItems.filter((i) => i.id !== productId);
    setCartItems(updated);
    await syncCartWithDatabase(updated);
  };

  const updateQuantity = async (productId, rawQuantity) => {
    const quantity = parseInt(rawQuantity, 10) || 0;
    const updated = quantity > 0
      ? cartItems.map((i) => (i.id === productId ? { ...i, quantity } : i))
      : cartItems.filter((i) => i.id !== productId);
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
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartProductIds = () => {
    return cartItems.map((item) => item.id);
  };

  const cartHasDonation = () => {
    return Array.isArray(cartItems) && cartItems.some((item) => item.isDonation);
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
        cartHasDonation,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
