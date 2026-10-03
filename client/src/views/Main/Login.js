import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../contexts/AuthContext';

// Login posts credentials only. The server sets the httpOnly auth cookies, records
// the login IP, and merges any guest cart into the customer's cart.

function Login() {
  const [user, setUser] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('/api/login', user);
      const { accessToken, user: loggedInUser } = response.data;

      await login({ token: accessToken, user: loggedInUser });
      navigate(loggedInUser.isAdmin ? '/AdminPanel' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login.');
    }
  };

  return (
    // maxWidth (not a fixed width) so the form fits phone screens.
    <div className="mx-auto mt-4 px-3 text-start" style={{ maxWidth: '400px' }}>
      {error && <p className="text-danger text-center">{error}</p>}
      <LoginForm
        inputs={user}
        handleChange={handleFormChange}
        handleSubmit={handleFormSubmit}
      />
      {/* There is no self-service password reset yet, so this goes to the contact form. */}
      <p className="forgot-password mt-2">
        Forgot your password? <Link to="/contact">Contact us</Link>
      </p>
    </div>
  );
}

export default Login;
