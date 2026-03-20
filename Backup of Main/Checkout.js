import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SquarePaymentForm from '../../components/SquarePaymentForm.js';
import CreditCardForm from '../../components/CreditCardForm.js';

// Configure API endpoints
const API_ENDPOINTS = {
  creditCard: '/api/payments/credit-card',
  paypal: '/api/payments/paypal/capture',
  afterpay: '/api/payments/afterpay',
  klarna: '/api/payments/klarna',
  square: '/api/initialize'
};

// Tax rates by state
const STATE_TAX_RATES = {
  'CA': 0.0725,
  'NY': 0.04,
  'TX': 0.0625,
  // Add more states as needed
};

function Checkout() {
  const navigate = useNavigate();
  const { 
    cartItems: cart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal
  } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [afterpayToken, setAfterpayToken] = useState(null);
  const [klarnaToken, setKlarnaToken] = useState(null);
  
  const [shippingState, setShippingState] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState('');
  const [useNewCard, setUseNewCard] = useState(true);

  useEffect(() => {
    // Load saved cards on component mount
    const fetchSavedCards = async () => {
      try {
        const response = await axios.get('/api/user/saved-cards');
        setSavedCards(response.data.cards || []);
      } catch (err) {
        console.error('Error fetching saved cards:', err);
      }
    };
    setPaymentMethod('creditCard');
    fetchSavedCards();
  }, []);

  // Calculate sales tax
  const calculateSalesTax = () => {
    const subtotal = getCartTotal();
    const taxRate = STATE_TAX_RATES[shippingState] || 0;
    return subtotal * taxRate;
  };

  // Calculate final total
  const calculateFinalTotal = () => {
    const subtotal = getCartTotal();
    const salesTax = calculateSalesTax();
    return subtotal + salesTax;
  };

  const continueShopping = () => {
    navigate('/browse', { replace: true });
  };

  // Handle credit card payment from CreditCardForm component
  const handleCreditCardSubmit = async (formData, saveCard = false) => {
    setLoading(true);
    setError('');

    try {
      let paymentData;
      
      if (useNewCard) {
        paymentData = {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardholderName: formData.cardholderName,
          zipCode: formData.zipCode,
          saveCard,
          amount: calculateFinalTotal(),
          taxAmount: calculateSalesTax(),
          shippingState,
          items: cart
        };
      } else {
        paymentData = {
          savedCardId: selectedSavedCard,
          amount: calculateFinalTotal(),
          taxAmount: calculateSalesTax(),
          shippingState,
          items: cart
        };
      }

      const response = await axios.post(API_ENDPOINTS.creditCard, paymentData);
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Square payment success
  const handleSquarePaymentSuccess = async (paymentResult) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.square, {
        sourceId: paymentResult.token,
        amount: Math.round(calculateFinalTotal() * 100), // Square expects amount in cents
        currency: 'USD',
        taxAmount: Math.round(calculateSalesTax() * 100),
        shippingState,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          basePriceMoney: {
            amount: Math.round(item.price * 100),
            currency: 'USD'
          }
        })),
        paymentDetails: paymentResult.details
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

  // Handle Square payment error
  const handleSquarePaymentError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };
  
  // PayPal Integration
  const createPayPalOrder = (data, actions) => {
    const subtotal = getCartTotal();
    const tax = calculateSalesTax();
    const total = calculateFinalTotal();

    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total.toString(),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: subtotal.toString()
            },
            tax_total: {
              currency_code: 'USD',
              value: tax.toString()
            }
          }
        },
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: 'USD',
            value: item.price.toString()
          }
        }))
      }]
    });
  };

  const onPayPalApprove = async (data, actions) => {
    try {
      const order = await actions.order.capture();
      const response = await axios.post(API_ENDPOINTS.paypal, {
        orderID: order.id,
        payerID: order.payer.payer_id,
        amount: calculateFinalTotal(),
        items: cart
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

  // Afterpay Integration
  const handleAfterpayPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.afterpay, {
        amount: calculateFinalTotal(),
        currency: 'USD',
        items: cart
      });

      if (response.data.token) {
        setAfterpayToken(response.data.token);
        if (window.AfterPay) {
          window.AfterPay.redirect({
            token: response.data.token,
            onComplete: (event) => {
              if (event.status === 'SUCCESS') {
                setSuccess(true);
              } else {
                setError('Afterpay payment failed.');
              }
              setLoading(false);
            }
          });
        } else {
          setError('Afterpay is not available. Please try another payment method.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Afterpay error:', err);
      setError('Could not initialize Afterpay.');
      setLoading(false);
    }
  };

  // Klarna Integration
  const handleKlarnaPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.klarna, {
        amount: calculateFinalTotal(),
        currency: 'USD',
        items: cart
      });

      if (response.data.client_token) {
        setKlarnaToken(response.data.client_token);
        
        if (window.Klarna && window.Klarna.Payments) {
          window.Klarna.Payments.load({
            container: '#klarna-payments-container',
            payment_method_category: 'pay_later',
            instance_id: 'klarna-payments-instance'
          }, (res) => {
            setLoading(false);
            if (res.show_form) {
              // Klarna form is ready
            } else {
              setError('Could not load Klarna payment form.');
            }
          });
        } else {
          setError('Klarna is not available. Please try another payment method.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Klarna error:', err);
      setError('Could not initialize Klarna.');
      setLoading(false);
    }
  };

  // Reset error when payment method changes
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
          <Button variant="primary" onClick={continueShopping} size="lg">
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
                <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="mb-3">
                <Form.Group>
                  <Form.Label>Shipping State</Form.Label>
                  <Form.Select 
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    required
                  >
                    <option value="">Select State</option>
                    {Object.keys(STATE_TAX_RATES).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Sales Tax ({(STATE_TAX_RATES[shippingState] * 100 || 0).toFixed(2)}%):</span>
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
              <Form.Check 
                type="radio"
                label="Credit Card"
                name="paymentMethod"
                value="creditCard"
                checked={paymentMethod === 'creditCard'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              <Form.Check 
                type="radio"
                label="Square"
                name="paymentMethod"
                value="square"
                checked={paymentMethod === 'square'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              <Form.Check 
                type="radio"
                label="PayPal"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              <Form.Check 
                type="radio"
                label="Afterpay"
                name="paymentMethod"
                value="afterpay"
                checked={paymentMethod === 'afterpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              <Form.Check 
                type="radio"
                label="Klarna"
                name="paymentMethod"
                value="klarna"
                checked={paymentMethod === 'klarna'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
            </Form>

            {paymentMethod === 'creditCard' && (
              <div>
                {savedCards.length > 0 && (
                  <div className="mb-3">
                    <Form.Check
                      type="radio"
                      label="Use a saved card"
                      checked={!useNewCard}
                      onChange={() => setUseNewCard(false)}
                    />
                    {!useNewCard && (
                      <Form.Select
                        className="mt-2"
                        value={selectedSavedCard}
                        onChange={(e) => setSelectedSavedCard(e.target.value)}
                        required={!useNewCard}
                      >
                        <option value="">Select a saved card</option>
                        {savedCards.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.brand} ending in {card.last4}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    <Form.Check
                      type="radio"
                      label="Use a new card"
                      checked={useNewCard}
                      onChange={() => setUseNewCard(true)}
                      className="mt-2"
                    />
                  </div>
                )}

                {useNewCard ? (
                  <CreditCardForm
                    onSubmit={handleCreditCardSubmit}
                    loading={loading}
                    disabled={!shippingState}
                    amount={calculateFinalTotal()}
                    showSaveOption={true}
                  />
                ) : (
                  <Button 
                    onClick={() => handleCreditCardSubmit({}, false)}
                    variant="primary" 
                    size="lg" 
                    className="w-100"
                    disabled={loading || !shippingState || !selectedSavedCard}
                  >
                    {loading ? 'Processing...' : `Pay $${calculateFinalTotal().toFixed(2)}`}
                  </Button>
                )}
                
                {!shippingState && (
                  <small className="text-muted d-block mt-2">
                    Please select a shipping state to continue
                  </small>
                )}
              </div>
            )}

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
                {shippingState ? (
                  <PayPalScriptProvider options={{ 
                    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
                    currency: "USD"
                  }}>
                    <PayPalButtons 
                      createOrder={createPayPalOrder}
                      onApprove={onPayPalApprove}
                      style={{ layout: "vertical" }}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <Alert variant="info">
                    Please select a shipping state to continue with PayPal
                  </Alert>
                )}
              </div>
            )}

            {paymentMethod === 'afterpay' && (
              <div>
                <div id="afterpay-widget" className="mb-3"></div>
                <Button 
                  onClick={handleAfterpayPayment}
                  disabled={loading || !shippingState}
                  variant="primary"
                  size="lg"
                  className="w-100"
                >
                  {loading ? 'Processing...' : `Pay $${calculateFinalTotal().toFixed(2)} with Afterpay`}
                </Button>
                {!shippingState && (
                  <small className="text-muted d-block mt-2">
                    Please select a shipping state to continue
                  </small>
                )}
              </div>
            )}

            {paymentMethod === 'klarna' && (
              <div>
                <div id="klarna-payments-container" className="mb-3"></div>
                <Button 
                  onClick={handleKlarnaPayment}
                  disabled={loading || !shippingState}
                  variant="primary"
                  size="lg"
                  className="w-100"
                >
                  {loading ? 'Processing...' : `Pay $${calculateFinalTotal().toFixed(2)} with Klarna`}
                </Button>
                {!shippingState && (
                  <small className="text-muted d-block mt-2">
                    Please select a shipping state to continue
                  </small>
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