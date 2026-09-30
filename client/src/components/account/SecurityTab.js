import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const MIN_PASSWORD_LENGTH = 8; // keep in sync with Controllers/Users.js

// Username, email and password changes (PUT /api/me/username, /api/me/email, /api/me/password).
// Both need the current password. The server issues fresh tokens, which we hand to
// AuthContext so the header updates straight away. A password change also signs out
// any other device.
function SecurityTab() {
  const { user, username, updateSession } = useAuth();

  const [nameForm, setNameForm] = useState({ username: '', currentPassword: '' });
  const [nameMessage, setNameMessage] = useState(null);

  const [emailForm, setEmailForm] = useState({ email: '', currentPassword: '' });
  const [emailMessage, setEmailMessage] = useState(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMessage, setPwMessage] = useState(null);

  const handleUsername = async (e) => {
    e.preventDefault();
    setNameMessage(null);
    try {
      const res = await axios.put('/api/me/username', nameForm);
      updateSession({ token: res.data.accessToken, user: res.data.user });
      setNameForm({ username: '', currentPassword: '' });
      setNameMessage({ variant: 'success', text: `Your username is now ${res.data.user.username}.` });
    } catch (err) {
      setNameMessage({ variant: 'danger', text: err.response?.data?.message || 'Could not change your username.' });
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setEmailMessage(null);
    try {
      const res = await axios.put('/api/me/email', emailForm);
      updateSession({ token: res.data.accessToken, user: res.data.user });
      setEmailForm({ email: '', currentPassword: '' });
      setEmailMessage({ variant: 'success', text: `Your email is now ${res.data.user.email}.` });
    } catch (err) {
      setEmailMessage({ variant: 'danger', text: err.response?.data?.message || 'Could not change your email.' });
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwMessage(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ variant: 'danger', text: 'New passwords do not match.' });
      return;
    }
    try {
      const res = await axios.put('/api/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      updateSession({ token: res.data.accessToken, user: res.data.user });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMessage({ variant: 'success', text: 'Password updated. Other devices have been signed out.' });
    } catch (err) {
      setPwMessage({ variant: 'danger', text: err.response?.data?.message || 'Could not change your password.' });
    }
  };

  return (
    <Row className="g-5">
      <Col md={6}>
        <h5>Change username</h5>
        <p className="text-muted">Currently signed in as <strong>{username}</strong>.</p>
        <Form onSubmit={handleUsername}>
          {nameMessage && <Alert variant={nameMessage.variant}>{nameMessage.text}</Alert>}
          <Form.Group controlId="newUsername" className="mb-3">
            <Form.Label>New username</Form.Label>
            <Form.Control
              type="text"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              value={nameForm.username}
              onChange={(e) => setNameForm({ ...nameForm, username: e.target.value })}
            />
          </Form.Group>
          <Form.Group controlId="usernameCurrentPassword" className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              required
              value={nameForm.currentPassword}
              onChange={(e) => setNameForm({ ...nameForm, currentPassword: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" variant="primary">Change username</Button>
        </Form>
      </Col>

      <Col md={6}>
        <h5>Change email</h5>
        <p className="text-muted">Currently <strong>{user?.email}</strong>. Your order history moves with it.</p>
        <Form onSubmit={handleEmail}>
          {emailMessage && <Alert variant={emailMessage.variant}>{emailMessage.text}</Alert>}
          <Form.Group controlId="newEmail" className="mb-3">
            <Form.Label>New email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              required
              value={emailForm.email}
              onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
            />
          </Form.Group>
          <Form.Group controlId="emailCurrentPassword" className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              required
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" variant="primary">Change email</Button>
        </Form>
      </Col>

      <Col md={6}>
        <h5>Change password</h5>
        <p className="text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
        <Form onSubmit={handlePassword}>
          {pwMessage && <Alert variant={pwMessage.variant}>{pwMessage.text}</Alert>}
          <Form.Group controlId="currentPassword" className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
          </Form.Group>
          <Form.Group controlId="newPassword" className="mb-3">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
          </Form.Group>
          <Form.Group controlId="confirmPassword" className="mb-3">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" variant="primary">Change password</Button>
        </Form>
      </Col>
    </Row>
  );
}

export default SecurityTab;
