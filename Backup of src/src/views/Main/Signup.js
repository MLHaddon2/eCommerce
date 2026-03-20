import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import SignupForm from '../../components/SignupForm';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

// FIXED:
// - Removed client-side IP fetch from https://api.ipify.org. The browser fetching
//   its own IP via a public third-party service is an unnecessary external dependency
//   that also has GDPR/CCPA implications. The server captures IP from req.ip or
//   X-Forwarded-For headers and appends the ipHistory entry itself.
// - Fixed login() call signature to use { token, user } object form, matching
//   the AuthContext API. Previously called as login(accessToken, { id, username })
//   with two separate arguments, which is the wrong signature and would have caused
//   the auth context to receive undefined for the user object.

function Signup() {
  const { cartItems } = useCart();
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    address: '',
    username: '',
    email: '',
    password: '',
    confPwd: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (user.password !== user.confPwd) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post('api/register', {
        username: user.username,
        email: user.email,
        password: user.password,
        confPwd: user.confPwd,
      });
      const { accessToken, userID, username } = response.data;

      // IP address and timestamp are captured server-side from req.ip.
      // The client sends only data the server can't derive itself.
      await axios.post('api/customers/create', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        cartItems: cartItems || [],
        totalOrders: 0,
        totalSpent: 0,
      });

      // Use consistent { token, user } signature matching AuthContext.login()
      login({ token: accessToken, user: { id: userID, username } });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup.');
    }
  };

  return (
    <div className="mw-50 m-auto" style={{ width: '400px' }}>
      {error && <p className="text-danger text-center">{error}</p>}
      <SignupForm
        inputs={user}
        handleChange={handleFormChange}
        handleSubmit={handleFormSubmit}
      />
      <p className="text-right">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;
