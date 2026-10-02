import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Mail } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

// Keep in sync with the default in Controllers/Contact.js (server env: CONTACT_EMAIL).
const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || 'skelesitesmlh@gmail.com';

// Keep in sync with LIMITS / MIN_MESSAGE_LENGTH in Controllers/Contact.js.
const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 10;

const EMPTY_FORM = { name: '', email: '', subject: '', message: '', leaveBlank: '' };

// Contact page: the shop's email address plus a form that posts to /api/contact,
// which emails the message to the shop inbox. Works for guests and logged-in users.
function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  // Pre-fill the reply address once the session is known, without overwriting what was typed.
  useEffect(() => {
    if (user?.email) setForm((current) => (current.email ? current : { ...current, email: user.email }));
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSending(true);
    try {
      await axios.post('/api/contact', form);
      setForm({ ...EMPTY_FORM, email: user?.email || '' });
      setStatus({ variant: 'success', text: "Thanks! Your message has been sent. We'll reply to the email address you gave." });
    } catch (err) {
      setStatus({
        variant: 'danger',
        text: err.response?.data?.message || `We couldn't send your message. Please email ${CONTACT_EMAIL} directly.`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Container className="mt-4 text-start">
      <h2 className="mb-4">Contact Us</h2>
      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <Mail size={20} className="me-2 text-primary" />
                Email
              </Card.Title>
              <Card.Text>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </Card.Text>
              <Card.Text className="text-muted">
                Questions about an order, a product or your account? Email us, or use the form and
                we'll reply to the address you give.
              </Card.Text>
              <Card.Text className="text-muted mb-0">
                Asking about an order? Include the order number so we can find it quickly.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Send us a message</Card.Title>
              <Form onSubmit={handleSubmit}>
                {status && <Alert variant={status.variant}>{status.text}</Alert>}
                <Row>
                  <Col sm={6}>
                    <Form.Group controlId="contactName" className="mb-3">
                      <Form.Label>Your name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        autoComplete="name"
                        maxLength={100}
                        required
                        value={form.name}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group controlId="contactEmail" className="mb-3">
                      <Form.Label>Your email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        autoComplete="email"
                        maxLength={255}
                        required
                        value={form.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group controlId="contactSubject" className="mb-3">
                  <Form.Label>Subject <span className="text-muted">(optional)</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    maxLength={150}
                    value={form.subject}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group controlId="contactMessage" className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    minLength={MIN_MESSAGE_LENGTH}
                    maxLength={MAX_MESSAGE_LENGTH}
                    required
                    value={form.message}
                    onChange={handleChange}
                  />
                  <Form.Text muted>{form.message.length} / {MAX_MESSAGE_LENGTH}</Form.Text>
                </Form.Group>
                {/* Honeypot: hidden from people, filled in by spam bots. The server drops those. */}
                <div className="d-none" aria-hidden="true">
                  <label htmlFor="contactLeaveBlank">Leave this blank</label>
                  <input
                    id="contactLeaveBlank"
                    type="text"
                    name="leaveBlank"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.leaveBlank}
                    onChange={handleChange}
                  />
                </div>
                <Button type="submit" variant="primary" disabled={sending}>
                  {sending ? <><Spinner animation="border" size="sm" className="me-2" />Sending…</> : 'Send message'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Contact;
