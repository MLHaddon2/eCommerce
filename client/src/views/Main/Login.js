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
