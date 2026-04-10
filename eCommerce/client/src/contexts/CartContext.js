// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useData } from './DataContext';
// import axios from '../api/axios';
// import { getCookie, COOKIE_KEYS } from '../Utils/cookieUtils';

// const CartContext = createContext();

// const normalizeIp = (ip) => ip.replace('::ffff:', '').trim();

// const getPersistedCart = () => {
//   try {
//     const savedCart = localStorage.getItem('cart');
//     return savedCart ? JSON.parse(savedCart) : [];
//   } catch (error) {
//     console.warn('Could not parse persisted cart from localStorage:', error);
//     return [];
//   }
// };

// const getOrCreateIpHistory = async () => {
//   try {
//     const ipResponse = await axios.get('proxy');
//     const ipAddress = normalizeIp(ipResponse.data.ip);
//     const IpResponse = await axios.get(`/api/ip-history/${ipAddress}`);
//     if (IpResponse.status === 200) {
//       return IpResponse.data;
//     } else if (IpResponse.status === 404) {
//       const newIpHistory = await axios.post('/api/ip-history/create', {
//         ipAddress,
//         lastLogin: null,
//         cartItems: []
//       });
//       return newIpHistory.data;
//     }
//   } catch (error) {
//     console.error('Error fetching or creating IP history:', error);
//   }
// };

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState(() => getPersistedCart());
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const { createIpHistory } = useData();

//   useEffect(() => {
//     localStorage.setItem('cart', JSON.stringify(cartItems));
//   }, [cartItems]);

//   const loadCartFromDatabase = async () => {
//     try {
//       // const persistedCart = getPersistedCart();
//       const ipResponse = await axios.get('proxy');
//       const ipAddress = normalizeIp(ipResponse.data.ip);

//       const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';

//       let remoteCart = [];

//       // USER CART
//       if (userId !== '0000') {
//         try {
//           const res = await axios.get(`/api/cart/get/${userId}/${ipAddress}`);
//           remoteCart = res?.data?.cartItems || [];
//         } catch (err) {
//           remoteCart = [];
//         }
//       }

//       // GUEST CART
//       else {
//         try {
//           const res = await axios.get(`/api/cart/get/${ipAddress}`);
//           remoteCart = res?.data?.cartItems;
//         } catch (err) {
//           remoteCart = [];
//         }
//       }

//       // PRIORITY:
//       // 1. Remote cart (if exists)
//       // 2. Persisted local cart (if remote empty)
//       // 3. Empty cart
//       if (remoteCart.length > 0) {
//         setCartItems(remoteCart);
//       } else {
//         setCartItems([]);
//       }

//     } catch (error) {
//       console.error('Error loading cart from database:', error);
//     }
//   };

//   const syncCartWithDatabase = async (cartItemsToSync) => {
//     const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';
//     const ipResponse = await axios.get('proxy');
//     const ipAddress = normalizeIp(ipResponse.data.ip);

//     try {
//       console.log('Syncing cart with database:', { userId, ipAddress, cartItemsToSync });
//       if (userId !== '0000') {
//         await axios.post(`/api/cart/update/${userId}/${ipAddress}`, {
//           id: userId,
//           cartItems: cartItemsToSync,
//         });
//       }
//       if (userId === '0000') {
//         await axios.post(`/api/cart/update/${ipAddress}`, {
//           cartItems: cartItemsToSync,
//         });
//       }
//     } catch (error) {
//       if (error.response?.status === 404) {
//         await createIpHistory({ ipAddress, lastLogin: null, cartItems: cartItemsToSync });
//       } else {
//         console.error('Error syncing guest cart with database:', error);
//       }
//     }
//   };

//   const addToCart = async (product) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const newCartItems = [...cartItems];
//       const existingItem = newCartItems.find(item => item.id === product.id);

//       if (existingItem) {
//         existingItem.quantity += 1;
//       } else {
//         newCartItems.push({ ...product, quantity: 1 });
//       }

//       setCartItems(newCartItems);
//       await syncCartWithDatabase(newCartItems);

//     } catch (error) {
//       setError('Failed to add item to cart');
//       console.error('Error adding product to cart:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const removeFromCart = async (productId) => {
//     try {
//       const newCartItems = cartItems.filter(item => item.id !== productId);
//       setCartItems(newCartItems);
//       await syncCartWithDatabase(newCartItems);
//     } catch (error) {
//       console.error('Error removing product from cart:', error);
//     }
//   };

//   const updateQuantity = async (productId, quantity) => {
//     if (quantity < 1) return;

//     const newCartItems = cartItems.map(item =>
//       item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
//     );

//     setCartItems(newCartItems);
//     await syncCartWithDatabase(newCartItems);
//   };

//   const clearCart = async () => {
//     setCartItems([]);
//     await syncCartWithDatabase([]);
//   };

//   const getCartTotal = () => {
//     return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
//   };

//   const getCartCount = () => {
//     return cartItems.reduce((count, item) => count + item.quantity, 0);
//   };

//   const getCartProductIds = () => {
//     return cartItems.map(item => item.id);
//   };

//   return (
//     <CartContext.Provider value={{
//       cartItems,
//       addToCart,
//       removeFromCart,
//       updateQuantity,
//       clearCart,
//       getCartTotal,
//       getCartCount,
//       getCartProductIds,
//       getOrCreateIpHistory,
//       syncCartWithDatabase,
//       loadCartFromDatabase,
//       isLoading,
//       error
//     }}>
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => {
//   const context = useContext(CartContext);
//   if (!context) {
//     throw new Error('useCart must be used within a CartProvider');
//   }
//   return context;
// };

// --------------------------------------------------------------------------------------------------------------------------------------------------__________----

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from '../api/axios';
// import { getCookie, COOKIE_KEYS } from '../Utils/cookieUtils';

// const CartContext = createContext();

// const normalizeIp = (ip) => ip.replace('::ffff:', '').trim();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);

//   /* ---------------------------------------------------------
//      LOAD CART
//   --------------------------------------------------------- */
//   const loadCartFromDatabase = async () => {
//     try {
//       const ipResponse = await axios.get('proxy');
//       const ipAddress = normalizeIp(ipResponse.data.ip);
//       const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';

//       const url =
//         userId !== '0000'
//           ? `/api/cart/get/${userId}/${ipAddress}`
//           : `/api/cart/get/${ipAddress}`;

//       const res = await axios.get(url);
//       setCartItems(res.data.cartItems || []);
//     } catch (error) {
//       console.error('Error loading cart:', error);
//       setCartItems([]);
//     }
//   };

//   /* ---------------------------------------------------------
//      SYNC CART
//   --------------------------------------------------------- */
//   const syncCartWithDatabase = async (items) => {
//     const ipResponse = await axios.get('proxy');
//     const ipAddress = normalizeIp(ipResponse.data.ip);
//     const userId = getCookie(COOKIE_KEYS.USER_ID) || '0000';

//     const url =
//       userId !== '0000'
//         ? `/api/cart/update/${userId}/${ipAddress}`
//         : `/api/cart/update/${ipAddress}`;

//     await axios.post(url, { cartItems: items });
//   };

//   /* ---------------------------------------------------------
//      CART ACTIONS
//   --------------------------------------------------------- */

//   const addToCart = async (product) => {
//     const updated = [...cartItems];
//     const existing = updated.find((i) => i.id === product.id);

//     if (existing) existing.quantity += 1;
//     else updated.push({ ...product, quantity: 1 });

//     setCartItems(updated);
//     await syncCartWithDatabase(updated);
//   };

//   const removeFromCart = async (productId) => {
//     const updated = cartItems.filter((i) => i.id !== productId);
//     setCartItems(updated);
//     await syncCartWithDatabase(updated);
//   };

//   const updateQuantity = async (productId, quantity) => {
//     const updated = cartItems.map((i) =>
//       i.id === productId ? { ...i, quantity } : i
//     );
//     setCartItems(updated);
//     await syncCartWithDatabase(updated);
//   };

//   const clearCart = async () => {
//     setCartItems([]);
//     await syncCartWithDatabase([]);
//   };

//   return (
//     <CartContext.Provider
//       value={{
//         cartItems,
//         loadCartFromDatabase,
//         addToCart,
//         removeFromCart,
//         updateQuantity,
//         clearCart
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => useContext(CartContext);


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
