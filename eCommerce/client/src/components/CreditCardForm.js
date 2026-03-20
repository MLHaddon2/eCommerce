import React, { useEffect, useRef, useState } from 'react';
import { Button, Alert, Spinner, Form } from 'react-bootstrap';
import { Lock } from 'lucide-react';

// FIXED (CRITICAL — security):
// The previous implementation collected raw cardNumber, expiryDate, and CVV in
// React state and passed them to onSubmit(formData) — meaning raw PAN data flowed
// through your own server, putting you in full PCI DSS scope.
//
// This version uses the Square Web Payments SDK (already used by SquarePaymentForm)
// to render a hosted card input. Square tokenizes the card entirely client-side;
// onSubmit is called with { token, details } — never raw card data.
//
// The parent (Checkout.js) already expects formData.token from this component.
//
// Environment variables required (same as SquarePaymentForm):
//   REACT_APP_SQUARE_APPLICATION_ID
//   REACT_APP_SQUARE_LOCATION_ID
//   REACT_APP_SQUARE_ENVIRONMENT  (defaults to 'sandbox')

const CreditCardForm = ({
  onSubmit,
  loading = false,
  disabled = false,
  amount = 0,
  showSaveOption = false,
  buttonText = 'Complete Payment',
}) => {
  const [card, setCard] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [initError, setInitError] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const cardContainerRef = useRef(null);
  const scriptRef = useRef(null);
  const initializeRef = useRef(false);

  const SQUARE_APPLICATION_ID = process.env.REACT_APP_SQUARE_APPLICATION_ID;
  const SQUARE_LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID;
  const SQUARE_ENVIRONMENT = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox';

  const getSquareScriptUrl = () =>
    SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

  useEffect(() => {
    if (!initializeRef.current) {
      loadSquareScript();
    }
    return () => {
      if (card) {
        try { card.destroy(); } catch (e) { /* ignore */ }
      }
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      initializeRef.current = false;
    };
  }, []);

  const loadSquareScript = async () => {
    try {
      if (initializeRef.current) return;
      setScriptLoading(true);
      setInitError('');

      if (!SQUARE_APPLICATION_ID || !SQUARE_LOCATION_ID) {
        throw new Error('Square Application ID and Location ID must be configured.');
      }

      if (window?.Square) {
        await initializeSquareCard();
        return;
      }

      const existingScript = document.querySelector(`script[src="${getSquareScriptUrl()}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initializeSquareCard);
        return;
      }

      if (scriptRef.current) return;

      const script = document.createElement('script');
      script.src = getSquareScriptUrl();
      script.async = true;
      scriptRef.current = script;

      script.onload = async () => {
        if (!initializeRef.current) await initializeSquareCard();
      };
      script.onerror = () => {
        setInitError('Failed to load Square Payment SDK. Please check your connection.');
        setScriptLoading(false);
        scriptRef.current = null;
      };

      document.head.appendChild(script);
    } catch (error) {
      setInitError(`Failed to initialize payment form: ${error.message}`);
      setScriptLoading(false);
    }
  };

  const initializeSquareCard = async () => {
    try {
      if (initializeRef.current) return;
      initializeRef.current = true;

      if (!window?.Square) {
        initializeRef.current = false;
        throw new Error('Square SDK not loaded.');
      }

      const paymentsInstance = window.Square.payments(
        SQUARE_APPLICATION_ID,
        SQUARE_LOCATION_ID
      );

      const cardInstance = await paymentsInstance.card({
        style: {
          '.input-container.is-focus': { borderColor: '#3b82f6' },
          '.input-container.is-error': { borderColor: '#ef4444' },
          '.message-text': { color: '#ef4444' },
          input: { color: '#374151' },
        },
      });

      if (cardContainerRef.current) {
        await cardInstance.attach(cardContainerRef.current);
        setCard(cardInstance);
        setIsInitialized(true);
        setScriptLoading(false);
      } else {
        initializeRef.current = false;
        throw new Error('Card container not found.');
      }
    } catch (error) {
      initializeRef.current = false;
      setInitError(`Failed to initialize payment form: ${error.message}`);
      setScriptLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!card || !isInitialized) return;

    try {
      const result = await card.tokenize();

      if (result.status === 'OK') {
        // Pass token (never raw card data) to Checkout.js
        onSubmit({ token: result.token, details: result.details }, saveCard);
      } else {
        const msg =
          result.errors?.[0]?.message ||
          'Payment failed. Please check your card details and try again.';
        onSubmit({ error: msg }, saveCard);
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      onSubmit({ error: 'An error occurred while processing your payment.' }, saveCard);
    }
  };

  const retry = () => {
    setInitError('');
    setIsInitialized(false);
    initializeRef.current = false;
    loadSquareScript();
  };

  if (initError) {
    return (
      <Alert variant="danger">
        <strong>Payment Error:</strong> {initError}
        <div className="mt-2">
          <Button variant="outline-danger" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label fw-semibold">Card Information</label>
        <div
          ref={cardContainerRef}
          id="credit-card-container"
          style={{
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
          }}
        >
          {(scriptLoading || !isInitialized) && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: '96px' }}
            >
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Loading payment form...</span>
            </div>
          )}
        </div>
        {isInitialized && (
          <small className="form-text text-muted">
            Secure payment processing powered by Square
          </small>
        )}
      </div>

      {showSaveOption && (
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="save-card"
            label="Save this card for future purchases"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
          />
        </Form.Group>
      )}

      <Alert variant="light" className="d-flex align-items-center mb-3 py-2">
        <Lock size={14} className="me-2 text-muted flex-shrink-0" />
        <small className="text-muted mb-0">
          Your payment information is encrypted and never stored on our servers
        </small>
      </Alert>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-100"
        disabled={!isInitialized || loading || disabled || scriptLoading}
      >
        {loading ? (
          <>
            <Spinner as="span" animation="border" size="sm" className="me-2" />
            Processing...
          </>
        ) : amount > 0 ? (
          `${buttonText} — $${amount.toFixed(2)}`
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
};

export default CreditCardForm;
