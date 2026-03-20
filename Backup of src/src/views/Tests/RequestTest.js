import React, { createContext, useState, useContext, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Form, Modal } from 'react-bootstrap';
import { PlusCircle, Edit, Trash, User, Clock, Globe, CreditCard } from 'lucide-react';
import axios from '../../api/axios';

const RequestTest = () => {
  const [customers, setCustomers] = useState();
  const [transactions, setTransactions] = useState();
  const [orders, setOrders] = useState();

  const getTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions/get');
      console.log("Response data: ", res);
      const transactions = res.data;
      // Set transactions first
      setTransactions(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleSetTransactions = async () => {
    const datetime = new Date();
    const today = datetime.toUTCString();
    const data = {
      orderId: 1,
      customerId: 1,
      amount: 100.00,
      status: 'Completed',
      timestamp: today,
      paymentMethod: 'Credit Card',
      lastFour: '1234',
      timeline: [
        {
          status: "Completed", 
          timestamp: today, 
          notes: [
            {details: "package has been shipped and received by the customer."}
          ]
        },
        {
          status: "Shipped", 
          timestamp: today, 
          notes: [
            {details: "Package has shipped. Please use this link to track the shipping."}
          ]
        },
        {
          status: "Processing", 
          timestamp: today, 
          notes: [
            {details: "Items are being processed and prepared for shipping."}
          ]
        }
      ]
    };
    try {
      const res = await axios.post('/api/transactions/create', data);
      console.log("Transaction Response Data: ", res.data);
      setTransactions(res.data);
    } catch (error) {
      console.error("Error creating transaction (Client Side): ", error);
    }
  };

  const getCustomers = async () => {
    try {
      const res = await axios.get('/api/customers/get');
      console.log("Response data: ", res);
      const customers = res.data;
      // Set customers first
      setCustomers(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSetCustomers = async () => {
    const datetime = new Date();
    const today = datetime.toUTCString();
    const data = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      lastLogin: today,
      ipHistory: [
        {ip: '192.168.1.1', timestamp: today}, 
        {ip: '192.168.1.2', timestamp: today}
      ],
      totalOrders: 10,
      totalSpent: 500.00
    }
    try {
      const res = await axios.post('/api/customers/create', data);
      console.log("Customer Response Data: ", res.data);
      setCustomers(res.data);
      
    } catch (error) {
      console.error("Error creating customer (Client Side): ", error);
    }
  }

  const getOrders = async () => {
    try {
      const res = await axios.get('/api/orders/get');
      console.log("Response data: ", res);
      const orders = res.data;
      // Set orders first
      setOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleSetOrders = async () => {
    const datetime = new Date();
    const today = datetime.toUTCString();
    const data = {
      customerId: 1,
      orderDate: today,
      orderItems: [
        { productId: 1, quantity: 2, price: 50.00 },
        { productId: 1, quantity: 2, price: 50.00 }
      ],
      totalAmount: 200.00,
      shippingAddress: '123 Main St, Anytown USA',
      paymentMethod: 'Credit Card',
      orderStatus: 'Completed'
    };
    try {
      const res = await axios.post('/api/orders/create', data);
      console.log("Order Response Data: ", res.data);
      setOrders(res.data);
    } catch (error) {
      console.error("Error creating order (Client Side): ", error);
    }
  }

  return (
    <div>
      <h1>Create Test</h1>
      <button onClick={handleSetTransactions}>Create Transaction</button>
      <button onClick={handleSetCustomers}>Create Customer</button>
      <button onClick={handleSetOrders}>Create Order</button>
      <h1>Request Test</h1>
      <button onClick={getTransactions}>Get Transactions</button>
      <button onClick={getCustomers}>Get Customers</button>
      <button onClick={getOrders}>Get Orders</button>
      <div>
        <h2>Transactions</h2>
        <div>
          {transactions ? 
            <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Payment Method</th>
                <th>Actions</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.orderId}</td>
                  <td>{transaction.customerId}</td>
                  <td>${transaction.amount}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.timestamp}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td>
                      {transaction.lastFour}
                      <CreditCard size={16} className="me-1" /> View Details
                  </td>
                  <td>
                    <tr>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Notes</th>
                    </tr>
                    {
                      transaction.timeline.map(timelineItem => (
                      <tr key={timelineItem.id}>
                        <td>{timelineItem.status}</td>
                        <td>{timelineItem.timestamp}</td>
                        <td>
                        {
                          timelineItem.notes.map(note => (
                            <tr key={note.id}>{note.details}</tr>
                        ))}
                        </td>
                      </tr>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
           : <></>}
        </div>
        <h2>Customers</h2>
        <div>
        {customers ? 
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>IP History</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.lastLogin}</td>
                  <td>
                    <tr>
                      <th>IP</th>
                      <th>Timestamp</th>
                    </tr>
                  {
                    customer.ipHistory.map(history => (
                    <tr key={history.ip}>
                      <td>{history.ip}</td>
                      <td>{history.timestamp}</td>
                    </tr>))
                  }
                  </td>
                  <td>{customer.totalOrders}</td>
                  <td>${customer.totalSpent}</td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm"
                      onClick
                    >
                      <User size={16} className="me-1" /> View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table> : <></>}
        </div>
        <h2>Orders</h2>
        <div>
              {orders ? 
                <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Order Items</th>
                <th>Total</th>
                <th>Shipping Address</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customerId}</td>
                  <td>{order.orderDate}</td>
                  <td>
                    <tr>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  {
                    order.orderItems.map(item => (
                      <tr key={item.productId}>
                        <td>{item.productId}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                      </tr>
                    ))
                  }
                  </td>
                  <td>${order.totalAmount}</td>
                  <td>{order.shippingAddress}</td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.orderStatus}</td>
                  <td>
                    <Button variant="info" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table> : <></>}
        </div>
      </div>
    </div>
  );
};

export default RequestTest;