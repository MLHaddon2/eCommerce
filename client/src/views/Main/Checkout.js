import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import SquarePaymentForm from '../../components/SquarePaymentForm.js';
import useGeoLocation from '../../Hooks/locationHook.js';
import { useAuth } from '../../contexts/AuthContext';

// Checkout is server-authoritative (see Controllers/Checkout.js):
//   - The server prices the cart it has stored, from the products table, and adds tax.
//     This page only displays that quote — it never sends prices or totals.
//   - Card data never touches our server: Square's SDK turns it into a one-time token.
//   - PayPal orders are created and captured by the server with the quoted amount.

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
  'WV', 'WI', 'WY',
];

const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;

// useGeoLocation returns a US state code ("CA") or null.
const stateFromLocation = (code) => (US_STATES.includes(code) ? code : '');

function Checkout() {
  const navigate = useNavigate();
  const { cartItems: cart, cartHasDonation, loadCartFromDatabase } = useCart();
  const isDonationOnly = cart.length > 0 && cart.every((item) => item.isDonation);

  const [paymentMethod, setPaymentMethod] = useState('square');
  const [shippingState, setShippingState] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  // Logged-in users get their account email pre-filled (they can still change it).
  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email);
  }, [user]);
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Pre-fill the state from the browser location, but never overwrite a user's choice.
  const location = useGeoLocation();
  useEffect(() => {
    const detected = stateFromLocation(location);
    if (detected) setShippingState((current) => current || detected);
  }, [location]);

  // Ask the server for the price whenever the cart or the state changes.
  useEffect(() => {
    if (cart.length === 0 || (!isDonationOnly && !shippingState)) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    axios.post('/api/checkout/quote', { shippingState })
      .then((res) => {
        if (!cancelled) { setQuote(res.data.quote); setError(''); }
      })
      .catch((err) => {
        if (!cancelled) { setQuote(null); setError(err.response?.data?.message || 'Could not price your order.'); }
      })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });

    return () => { cancelled = true; };
  }, [cart, shippingState, isDonationOnly]);

  const checkoutDetails = () => ({ shippingState, shippingAddress, email: email.trim() });

  const handleSuccess = async (data) => {
    setCompletedOrder(data);
    await loadCartFromDatabase(); // the server emptied the cart
  };

  const handleSquareToken = async ({ token, idempotencyKey }) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/checkout/square', {
        sourceId: token,
        idempotencyKey,
        ...checkoutDetails(),
      });
      await handleSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createPayPalOrder = async () => {
    setError('');
    const res = await axios.post('/api/checkout/paypal/order', checkoutDetails());
    return res.data.id;
  };

  const onPayPalApprove = async (data) => {
    try {
      const res = await axios.post('/api/checkout/paypal/capture', {
        orderID: data.orderID,
        ...checkoutDetails(),
      });
      await handleSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'PayPal payment failed. Please try again.');
    }
  };

  useEffect(() => {
    setError('');
  }, [paymentMethod]);

  // Payment methods allowed for this shipping state come from the server quote (TODO 4).
  const paymentMethods = quote?.paymentMethods || [
    { id: 'square', label: 'Card (Square)' },
    { id: 'paypal', label: 'PayPal' },
  ];
  useEffect(() => {
    if (quote && !quote.paymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(quote.paymentMethods[0]?.id || '');
    }
  }, [quote, paymentMethod]);

  if (completedOrder) {
    return (
      <Container className="mt-4">
        <Alert variant="success">
          <Alert.Heading>Payment Successful!</Alert.Heading>
          <p>
            Thank you for your {cartHasDonation() ? 'support' : 'purchase'}. Order #{completedOrder.orderId} for{' '}
            {dollars(completedOrder.totalCents)} has been processed.
          </p>
          {completedOrder.receiptEmail && (
            <p className="mb-0">A receipt is on its way to <strong>{completedOrder.receiptEmail}</strong>.</p>
          )}
        </Alert>
        <div className="text-center">
          <Button variant="primary" onClick={() => navigate('/browse', { replace: true })} size="lg">
            Continue Shopping
          </Button>
        </div>
      </Container>
    );
  }

  const readyToPay = Boolean(quote) && !quoteLoading && !loading && emailLooksValid;
  const needsState = !isDonationOnly && !shippingState;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Checkout</h2>
      {cart.length === 0 ? (
        <div className="text-center">
          <h4>Your cart is empty</h4>
          <Button variant="primary" onClick={() => navigate('/browse')}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <Row>
          {error && (
            <Col xs={12}>
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            </Col>
          )}

          <Col md={6}>
            <Form.Group className="mb-4" controlId="receiptEmail">
              <Form.Label>Email for your receipt</Form.Label>
              <Form.Control
                type="email"
                autoComplete="email"
                required
                value={email}
                isInvalid={email.length > 0 && !emailLooksValid}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Form.Control.Feedback type="invalid">Please enter a valid email address.</Form.Control.Feedback>
            </Form.Group>

            {!isDonationOnly && (
              <>
                <h4>Shipping</h4>
                <Form className="mb-4">
                  <Form.Group className="mb-3" controlId="shippingState">
                    <Form.Label>State</Form.Label>
                    <Form.Select value={shippingState} onChange={(e) => setShippingState(e.target.value)}>
                      <option value="">Choose a state…</option>
                      {US_STATES.map((code) => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="shippingAddress">
                    <Form.Label>Street address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      maxLength={255}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Main St, City, ZIP"
                    />
                  </Form.Group>
                </Form>
              </>
            )}

            <h4>Order Summary</h4>
            <div className="border rounded p-3 mb-4">
              {quoteLoading && (
                <div className="text-center my-2"><Spinner animation="border" size="sm" /> Calculating…</div>
              )}
              {!quote && !quoteLoading && (
                <p className="text-muted mb-0">
                  {needsState ? 'Choose a shipping state to see your total.' : "We couldn't price this order — see the message above."}
                </p>
              )}
              {quote && !quoteLoading && (
                <>
                  {quote.lines.map((line) => (
                    <div key={line.productId} className="d-flex justify-content-between align-items-center mb-2">
                      <span>{line.name} x {line.quantity}</span>
                      <span>{dollars(line.lineTotalCents)}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>{dollars(quote.subtotalCents)}</span>
                  </div>
                  {quote.requiresShipping ? (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Sales Tax ({quote.shippingState}, {(quote.taxRate * 100).toFixed(2)}%):</span>
                      <span>{dollars(quote.taxCents)}</span>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Tax:</span>
                      <span>None (Donation)</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Total:</strong>
                    <strong>{dollars(quote.totalCents)}</strong>
                  </div>
                </>
              )}
            </div>
          </Col>

          <Col md={6}>
            <h4>Payment Method</h4>
            <Form className="mb-4">
              {paymentMethods.map(({ id: method, label }) => (
                <Form.Check
                  key={method}
                  type="radio"
                  id={`payment-${method}`}
                  label={label}
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
              ))}
            </Form>

            {quote && !emailLooksValid && (
              <Alert variant="info">Enter an email for your receipt to continue.</Alert>
            )}

            {!quote && !quoteLoading && needsState && (
              <Alert variant="info">Choose a shipping state to continue.</Alert>
            )}

            {paymentMethod === 'square' && quote && (
              <SquarePaymentForm
                amount={quote.totalCents / 100}
                onTokenReceived={handleSquareToken}
                disabled={!readyToPay}
              />
            )}

            {paymentMethod === 'paypal' && quote && (
              <PayPalScriptProvider
                options={{
                  'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID,
                  currency: 'USD',
                }}
              >
                <PayPalButtons
                  // Re-create the buttons when the total changes so PayPal shows the right amount.
                  forceReRender={[quote.totalCents]}
                  disabled={!readyToPay}
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={() => setError('PayPal could not start the payment. Please try again.')}
                  style={{ layout: 'vertical' }}
                />
              </PayPalScriptProvider>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Checkout;
