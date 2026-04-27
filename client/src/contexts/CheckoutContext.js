import { createContext, useContext, useState, useEffect } from 'react';

const CheckoutContext = createContext();

export const CheckoutProvider = ({ children }) => {
  const [checkoutData, setCheckoutData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    paymentMethod: '',
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    billingZip: '',
    shippingMethod: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: ''
  });

  const [cartItems, setCartItems] = useState(() => {
    const storedCartItems = localStorage.getItem('cart');
    return storedCartItems ? JSON.parse(storedCartItems) : [];
    });
};
