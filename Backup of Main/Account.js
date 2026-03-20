import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext.js';
import { COOKIE_KEYS, getCookie, setCookie } from '../../Utils/cookieUtils.js';

// TODO: Get rid of all the local storage

function Account() {
  const { customer, getCustomer, updateCustomer, orders, getOrders } = useData();

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
  });

  const [stateOrders, setStateOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const id = getCookie(COOKIE_KEYS.USER_ID);
      await updateCustomer(id, user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetCustomer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let id = getCookie(COOKIE_KEYS.USER_ID);

      // Fall back to localStorage if cookie not set, then persist to cookie
      if (!id) {
        id = localStorage.getItem(COOKIE_KEYS.USER_ID);
        if (id) {
          setCookie(COOKIE_KEYS.USER_ID, id);
        }
      }

      if (!id) {
        throw new Error('No user ID found');
      }

      // Fetch customer data
      const customerData = await getCustomer(id);
      if (!customerData) {
        throw new Error('Customer not found');
      }

      // Fetch all orders
      await getOrders();

      // Filter orders for this customer
      const customerOrders = orders.filter(order => order.customerId === parseInt(id));

      // Update user state with the customer's information
      setUser({
        firstName: customerData.firstName || "",
        lastName:  customerData.lastName  || "",
        email:     customerData.email     || "",
        address:   customerData.address   || "",
      });

      setStateOrders(customerOrders);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSetCustomer();
  }, []);

  // Update state when customer data changes from context
  useEffect(() => {
    if (customer) {
      setUser({
        firstName: customer.firstName || "",
        lastName:  customer.lastName  || "",
        email:     customer.email     || "",
        address:   customer.address   || "",
      });
    }
  }, [customer]);

  // Update orders when orders data changes from context
  useEffect(() => {
    if (orders && customer) {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      setStateOrders(customerOrders);
    }
  }, [orders, customer]);

  if (isLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center">Loading account information...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          Error loading account: {error}
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <h2 className="mb-4">Your Account</h2>
        <Row>
          <Col md={6}>
            <h4>Personal Information</h4>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formFirstName" className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={user.firstName}
                  onChange={(e) => setUser({...user, firstName: e.target.value})}
                  placeholder="Enter your first name"
                />
              </Form.Group>

              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={user.lastName}
                  onChange={(e) => setUser({...user, lastName: e.target.value})}
                  placeholder="Enter your last name"
                />
              </Form.Group>

              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({...user, email: e.target.value})}
                  placeholder="Enter your email"
                />
              </Form.Group>

              <Form.Group controlId="formAddress" className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={user.address}
                  onChange={(e) => setUser({...user, address: e.target.value})}
                  placeholder="Enter your address"
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="mt-3">
                Update Information
              </Button>
            </Form>
          </Col>

          <Col md={6}>
            <h4>Order History</h4>
            {stateOrders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stateOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
                      <td>{order.orderStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Account;
