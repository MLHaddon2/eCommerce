import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../../api/axios';

// Name and address from the customer profile (GET/PUT /api/me/customer).
// Email is the link between the login and the profile, so it's shown read-only.
function ProfileTab() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const applyCustomer = (customer) => {
    setProfile({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      address: customer.address || '',
    });
  };

  useEffect(() => {
    axios.get('/api/me/customer')
      .then((res) => applyCustomer(res.data.customer))
      .catch((err) => setMessage({ variant: 'danger', text: err.response?.data?.message || 'Could not load your profile.' }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await axios.put('/api/me/customer', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
      });
      applyCustomer(res.data.customer);
      setMessage({ variant: 'success', text: 'Your information was updated.' });
    } catch (err) {
      setMessage({ variant: 'danger', text: err.response?.data?.message || 'Could not update your information.' });
    }
  };

  if (isLoading) return <div className="text-center py-4"><Spinner animation="border" size="sm" /> Loading profile…</div>;

  const field = (name) => ({
    value: profile[name],
    onChange: (e) => setProfile({ ...profile, [name]: e.target.value }),
  });

  return (
    <Form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      {message && <Alert variant={message.variant}>{message.text}</Alert>}

      <Form.Group controlId="formFirstName" className="mb-3">
        <Form.Label>First Name</Form.Label>
        <Form.Control type="text" placeholder="Enter your first name" {...field('firstName')} />
      </Form.Group>

      <Form.Group controlId="formLastName" className="mb-3">
        <Form.Label>Last Name</Form.Label>
        <Form.Control type="text" placeholder="Enter your last name" {...field('lastName')} />
      </Form.Group>

      <Form.Group controlId="formEmail" className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" value={profile.email} readOnly plaintext />
        <Form.Text muted>You can change this on the Security tab.</Form.Text>
      </Form.Group>

      <Form.Group controlId="formAddress" className="mb-3">
        <Form.Label>Address</Form.Label>
        <Form.Control as="textarea" rows={3} placeholder="Enter your address" {...field('address')} />
      </Form.Group>

      <Button variant="primary" type="submit">Update Information</Button>
    </Form>
  );
}

export default ProfileTab;
