import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

// FIXED:
// - IP address collection moved to the server side. Previously the browser fetched
//   the IP from a proxy endpoint and then sent it back to the API — this is
//   redundant and inconsistent with Signup.js which called ipify.org directly.
//   The server can read the IP from req.ip / X-Forwarded-For headers directly.
//   The client now sends only the data the server can't derive itself (cartItems).
// - login() call now uses the same { token, user } signature as the AuthContext
//   expects, matching what was already used correctly in this file.

function Login() {
  const { cartItems } = useCart();
  const [user, setUser] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  /**
   * Updates the customer record on login.
   * IP address and timestamp are captured server-side — the client no longer
   * needs to fetch or transmit IP data.
   */
  const handleUpdateCustomer = async (userData) => {
    try {
      await axios.put(`api/customers/update/${userData.id}`, {
        cartItems: cartItems || [],
        // Server will append { ip, timestamp } to ipHistory from req.ip
        recordLogin: true,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('api/login', user);
      const { accessToken, userRes } = response.data;

      if (userRes.username !== 'admin') {
        try {
          await handleUpdateCustomer(userRes);
        } catch (customerError) {
          console.error('Error updating customer data:', customerError);
          setError('Logged in successfully, but there was an error updating some user data.');
        }
      }

      await login({ token: accessToken, user: userRes });
      navigate(userRes.username === 'admin' ? '/AdminPanel' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    }
  };

  return (
    <div className="mw-50 m-auto" style={{ width: '400px' }}>
      {error && <p className="text-danger text-center">{error}</p>}
      <LoginForm
        inputs={user}
        handleChange={handleFormChange}
        handleSubmit={handleFormSubmit}
      />
      <p className="forgot-password text-right">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}

export default Login;
