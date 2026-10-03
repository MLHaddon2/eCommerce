import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import SignupForm from '../../components/SignupForm';
import { useAuth } from '../../contexts/AuthContext';

// Register creates the login and the customer profile in one request. The server
// sets the httpOnly auth cookies and moves any guest cart onto the new account.

function Signup() {
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (user.password !== user.confPwd) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/register', {
        username: user.username,
        email: user.email,
        password: user.password,
        confPwd: user.confPwd,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
      });
      const { accessToken, user: newUser } = response.data;

      await login({ token: accessToken, user: newUser });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // maxWidth (not a fixed width) so the form fits phone screens.
    <div className="mx-auto mt-4 px-3 text-start" style={{ maxWidth: '400px' }}>
      {error && <p className="text-danger text-center">{error}</p>}
      <SignupForm
        inputs={user}
        handleChange={handleFormChange}
        handleSubmit={handleFormSubmit}
        loading={loading}
      />
      <p className="mt-2">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;
