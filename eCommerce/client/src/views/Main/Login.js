import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../api/axios";
import LoginForm from '../../components/LoginForm'
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

function Login() {
  const {
    cartItems
  } = useCart();
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFormChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateCustomer = async (userData) => {
    const ipResponse = await axios.get('proxy');
    const ipAddress = ipResponse.data.ip;
    const dateTime = new Date().toUTCString();
    try {
      const res = await axios.get(`api/customers/get/${userData.id}`);
      console.log({message: "Customer response: ", res});
      const currentIP = res.data.customer.ipHistory;
  
  
      const updatedIP = [
        ...currentIP,
        { ip: ipAddress, timestamp: dateTime }
      ];
  
      await axios.put(`api/customers/update/${userData.id}`, {
        email: res.data.customer.email,
        cartItems: cartItems || [],
        lastLogin: dateTime,
        ipHistory: updatedIP,
        totalOrders: res.data.customer.totalOrders || 0,
        totalSpent: res.data.customer.totalSpent || 0
      });

      return true;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // First, handle the login
      const response = await axios.post('api/login', user);
      const { accessToken, userRes } = response.data;
      console.log(response.data);
      // If not admin, update customer data before completing login
      if (userRes.username !== 'admin') {
        try {
          await handleUpdateCustomer(userRes);
        } catch (customerError) {
          // Log the error but don't prevent login
          console.error("Error updating customer data:", customerError);
          // Optionally set a warning message
          setError("Logged in successfully, but there was an error updating some user data");
        }
      }

      // Complete login and navigation
      await login({ token: accessToken, user: userRes });
      navigate(userRes.username === 'admin' ? '/AdminPanel' : "/", { replace: true });
      
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during login");
    }
  };

  return (
    <div className="mw-50 m-auto" style={{ width: "400px" }}>
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

