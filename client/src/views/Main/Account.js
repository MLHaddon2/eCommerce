import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext.js';
import { COOKIE_KEYS, getCookie } from '../../Utils/cookieUtils.js';

// FIXED:
// - Fixed race condition in order filtering. Previously called `await getOrders()`
//   then immediately filtered the stale `orders` variable from the closure — the
//   React state update from getOrders hadn't propagated yet. Now uses the return
//   value of getOrders() directly for the initial load.
// - Removed the localStorage fallback for USER_ID (addresses the TODO comment).
//   If the cookie is not present the user is unauthenticated and should be redirected
//   rather than falling back to potentially stale localStorage data.
// - Removed the setCookie import that was only used for the localStorage fallback.

function Account() {
  const { customer, getCustomer, updateCustomer, getOrders } = useData();

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
  });

  const [stateOrders, setStateOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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

      const id = getCookie(COOKIE_KEYS.USER_ID);
      if (!id) {
        throw new Error('No user ID found. Please log in again.');
      }

      const customerData = await getCustomer(id);
      if (!customerData) {
        throw new Error('Customer not found.');
      }

      // Use the return value directly to avoid the stale-closure race condition.
      // The `orders` state variable in the context may not have updated yet when
      // we try to filter it on the very next line after awaiting getOrders().
      const allOrders = await getOrders();
      const customerOrders = (allOrders || []).filter(
        (order) => order.customerId === parseInt(id)
      );

      setUser({
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        email: customerData.email || '',
        address: customerData.address || '',
      });

      setStateOrders(customerOrders);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSetCustomer();
  }, []);

  // Keep user form in sync if the context customer value changes (e.g. after an update)
  useEffect(() => {
    if (customer) {
      setUser({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

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
        <div className="alert alert-danger">Error loading account: {error}</div>
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
                  onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                  placeholder="Enter your first name"
                />
              </Form.Group>

              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={user.lastName}
                  onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                  placeholder="Enter your last name"
                />
              </Form.Group>

              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </Form.Group>

              <Form.Group controlId="formAddress" className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={user.address}
                  onChange={(e) => setUser({ ...user, address: e.target.value })}
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
