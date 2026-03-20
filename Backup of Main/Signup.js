import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from '../../api/axios';
import SignupForm from '../../components/SignupForm';
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from '../../contexts/CartContext';

function Signup() {
  const {
    cartItems
  } = useCart();
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    address: '',
    username: '',
    email: '',
    password: '',
    confPwd: ''
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = e => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setError("");
    const dateTime = new Date().toUTCString();

    if (user.password !== user.confPwd) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post('api/register', {
        username: user.username,
        email: user.email,
        password: user.password,
        confPwd: user.confPwd
      });
      const { accessToken, userID, username } = response.data;

      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      const ipAddress = ipResponse.data.ip;

      console.log("IP Data received: ", ipAddress);

      await axios.post('api/customers/create', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        cartItems: cartItems || [],
        lastLogin: dateTime,
        ipHistory: [{ip: ipAddress, timestamp: dateTime}],
        totalOrders: 0,
        totalSpent: 0
      });

      login(accessToken, { id: userID, username });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during signup");
    }
  };

  return (
    <div className="mw-50 m-auto" style={{width: "400px"}} >
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
