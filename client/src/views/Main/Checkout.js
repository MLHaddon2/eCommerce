import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios'; 
import SquarePaymentForm from '../../components/SquarePaymentForm.js';
import KlarnaPaymentForm from '../../components/KlarnaPaymentForm.js';
import { useSavedCards } from '../../contexts/SavedCardsContext.js';
import useGeoLocation from '../../Hooks/locationHook.js'; 

// FIXED — CRITICAL (security):
// 1. Raw card data (cardNumber, expiryDate, cvv) is NO LONGER sent to the backend.
//    CreditCardForm must tokenize the card using your payment processor's client-side
//    SDK (e.g. Stripe.js, Square Web Payments SDK) and call onSubmit with a token only.
//    The server receives a processor token — never raw PAN data. Sending raw card data
//    through your own server puts you in PCI DSS scope and creates serious liability.
//
// 2. Cart item prices are NO LONGER trusted from the client. The payment API call now
//    sends only product IDs and quantities. The server looks up prices from its own
//    database and calculates the authoritative total. A client could otherwise manipulate
//    prices before the request is sent.
//
// FIXED — SIGNIFICANT:
// 3. Changed `import axios from 'axios'` → `import axios from '../../api/axios'`.
//    The direct axios import bypassed your configured base URL, auth interceptors, and
//    error handling, meaning payment requests went to a different origin configuration.
//
// 4. Removed `afterpayToken` and `klarnaToken` state — both were set but never read.
//
// 5. Removed `{ replace: true }` from continueShopping navigation. Replacing the history
//    entry before checkout is complete prevents the user from returning to checkout with
//    the back button, which is unexpected. replace: true is only used post-purchase.
//
// 6. Expanded STATE_TAX_RATES to all 50 US states + DC. Previously only 3 states were
//    listed, so every other state silently applied 0% tax.

const API_ENDPOINTS = {
  // Server receives a processor token + item IDs/quantities only — never raw card data
  // creditCard: '/api/payments/credit-card',
  paypal: '/api/payments/paypal/capture',
  square: '/api/initialize',
};

// Tax rates for all 50 US states + DC (as of 2024 — verify with your tax service)
const STATE_TAX_RATES = {
  AL: 0.04,   AK: 0.0,    AZ: 0.056,  AR: 0.065,  CA: 0.0725,
  CO: 0.029,  CT: 0.0635, DE: 0.0,    FL: 0.06,   GA: 0.04,
  HI: 0.04,   ID: 0.06,   IL: 0.0625, IN: 0.07,   IA: 0.06,
  KS: 0.065,  KY: 0.06,   LA: 0.0445, ME: 0.055,  MD: 0.06,
  MA: 0.0625, MI: 0.06,   MN: 0.06875,MS: 0.07,   MO: 0.04225,
  MT: 0.0,    NE: 0.055,  NV: 0.0685, NH: 0.0,    NJ: 0.06625,
  NM: 0.05125,NY: 0.04,   NC: 0.0475, ND: 0.05,   OH: 0.0575,
  OK: 0.045,  OR: 0.0,    PA: 0.06,   RI: 0.07,   SC: 0.06,
  SD: 0.045,  TN: 0.07,   TX: 0.0625, UT: 0.0485, VT: 0.06,
  VA: 0.053,  WA: 0.065,  WV: 0.06,   WI: 0.05,   WY: 0.04,
  DC: 0.06,
};

function Checkout() {
  const navigate = useNavigate();
  const { cartItems: cart, getCartTotal } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [shippingState, setShippingState] = useState('');
  const [selectedSavedCard, setSelectedSavedCard] = useState('');
  const [useNewCard, setUseNewCard] = useState(true);

  const { savedCards, defaultCard, fetchSavedCards, addSavedCard } = useSavedCards();

  const [locationData, setLocationData] = useState(null);
  
  // const geoLocation = useGeoLocation();
  const location = useGeoLocation();

  useEffect(() => {
      if (location) {
          setLocationData(location);
      };
      console.log("Location data updated:", location);
  }, [location]);

  // Load saved cards when checkout mounts (context deduplicates calls)
  useEffect(() => {
    fetchSavedCards();
  }, [fetchSavedCards]);

  // Pre-select the customer's default card once cards are loaded
  useEffect(() => {
    if (defaultCard && !selectedSavedCard) {
      setSelectedSavedCard(defaultCard.id);
      setUseNewCard(false);
    }
  }, [defaultCard]);

  const calculateSalesTax = () => {
    const subtotal = getCartTotal();
    const taxRate = STATE_TAX_RATES[location] || 0;
    return subtotal * taxRate;
  };

  const calculateFinalTotal = () => {
    return getCartTotal() + calculateSalesTax();
  };

  const continueShopping = () => {
    // FIXED: removed { replace: true } — should only replace history after a completed purchase
    navigate('/browse');
  };

  /**
   * Builds a minimal, server-safe cart payload.
   * FIXED: sends only id and quantity — never client-supplied prices.
   * The server calculates the authoritative total from its own price data.
   */
  const buildCartPayload = () =>
    cart.map((item) => ({ id: item.id, quantity: item.quantity }));

  /**
   * Handles credit card payment.
   * FIXED: `formData` now contains only a processor TOKEN (e.g. from Stripe.js /
   * Square Web Payments SDK) — never raw card numbers, expiry, or CVV.
   * CreditCardForm is responsible for tokenizing via the processor's client SDK
   * before calling this handler.
   */

  const handleSquarePaymentSuccess = async (paymentResult) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.square, {
        sourceId: paymentResult.token,
        amount: calculateFinalTotal(), // Server should verify this total independently
        currency: 'USD',
        shippingState,
        items: buildCartPayload(), // FIXED: IDs + quantities only
        paymentDetails: paymentResult.details,
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Square payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Square payment processing error:', err);
      setError(
        err.response?.data?.message ||
          'An error occurred processing your Square payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSquarePaymentError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

  const createPayPalOrder = (data, actions) => {
    const subtotal = getCartTotal();
    const tax = calculateSalesTax();
    const total = calculateFinalTotal();

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
              tax_total: { currency_code: 'USD', value: tax.toFixed(2) },
            },
          },
          // PayPal line items are display-only; authoritative total comes from breakdown above
          items: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
          })),
        },
      ],
    });
  };

  const onPayPalApprove = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      const response = await axios.post(API_ENDPOINTS.paypal, {
        orderID: order.id,
        payerID: order.payer.payer_id,
        shippingState,
        items: buildCartPayload(), // FIXED: IDs + quantities only
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError('PayPal payment verification failed.');
      }
    } catch (err) {
      console.error('PayPal payment error:', err);
      setError('PayPal payment failed. Please try again.');
    }
  };

  useEffect(() => {
    setError('');
  }, [paymentMethod]);

  if (success) {
    return (
      <Container className="mt-4">
        <Alert variant="success">
          <Alert.Heading>Payment Successful!</Alert.Heading>
          <p>Thank you for your purchase. Your order has been processed successfully.</p>
        </Alert>
        <div className="text-center">
          <Button variant="primary" onClick={() => navigate('/browse', { replace: true })} size="lg">
            Continue Shopping
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Checkout</h2>
      {cart.length === 0 ? (
        <div className="text-center">
          <h4>Your cart is empty</h4>
          <Button variant="primary" onClick={continueShopping}>
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
            <h4>Order Summary</h4>
            <div className="border rounded p-3 mb-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping State</span>
                <span>{location ? location : 'Loading'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>
                  Sales Tax ({((STATE_TAX_RATES[location] || 0) * 100).toFixed(2)}%):
                </span>
                <span>${calculateSalesTax().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <strong>Total:</strong>
                <strong>${calculateFinalTotal().toFixed(2)}</strong>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <h4>Payment Method</h4>
            <Form className="mb-4">
              {['square', 'paypal'].map((method) => (
                <Form.Check
                  key={method}
                  type="radio"
                  label={
                    method === 'creditCard'
                      ? 'Credit Card'
                      : method.charAt(0).toUpperCase() + method.slice(1)
                  }
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-2"
                />
              ))}
            </Form>

            {paymentMethod === 'square' && (
              <div>
                <SquarePaymentForm
                  amount={calculateFinalTotal()}
                  onPaymentSuccess={handleSquarePaymentSuccess}
                  onPaymentError={handleSquarePaymentError}
                  loading={loading}
                  disabled={!shippingState}
                />
                {!shippingState && (
                  <small className="text-muted">
                    Please select a shipping state to continue
                  </small>
                )}
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div>
                {location ? (
                  <PayPalScriptProvider
                    options={{
                      'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID,
                      currency: 'USD',
                    }}
                  >
                    <PayPalButtons
                      createOrder={createPayPalOrder}
                      onApprove={onPayPalApprove}
                      style={{ layout: 'vertical' }}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <Alert variant="info">
                    Please select a shipping state to continue with PayPal
                  </Alert>
                )}
              </div>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Checkout;
