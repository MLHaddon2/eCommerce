import React, { useEffect, useRef, useState } from 'react';
import { Button, Alert, Spinner, Form } from 'react-bootstrap';
import { Lock } from 'lucide-react';

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
  const isMountedRef = useRef(true);

  const SQUARE_APPLICATION_ID = process.env.REACT_APP_SQUARE_APPLICATION_ID;
  const SQUARE_LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID;
  const SQUARE_ENVIRONMENT = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox';

  const squareScriptUrl =
    SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';

  useEffect(() => {
    isMountedRef.current = true;
    initializeSquare();

    return () => {
      isMountedRef.current = false;
      // Destroy the card instance on unmount to prevent orphaned iframes
      setCard((prev) => {
        if (prev) {
          try { prev.destroy(); } catch (e) { /* ignore */ }
        }
        return null;
      });
    };
  }, []);

  const initializeSquare = async () => {
    try {
      setScriptLoading(true);
      setInitError('');

      if (!SQUARE_APPLICATION_ID || !SQUARE_LOCATION_ID) {
        throw new Error('Square Application ID and Location ID must be configured.');
      }

      // Load the SDK script if it isn't already on the page
      if (!window.Square) {
        await new Promise((resolve, reject) => {
          // Reuse an in-flight script tag if one already exists
          const existing = document.querySelector(`script[src="${squareScriptUrl}"]`);
          if (existing) {
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', () =>
              reject(new Error('Failed to load Square SDK'))
            );
            return;
          }

          const script = document.createElement('script');
          script.src = squareScriptUrl;
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Square SDK'));
          document.head.appendChild(script);
        });
      }

      if (!isMountedRef.current) return;

      const payments = window.Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);

      const cardInstance = await payments.card({
        style: {
          '.input-container.is-focus': { borderColor: '#3b82f6' },
          '.input-container.is-error': { borderColor: '#ef4444' },
          '.message-text': { color: '#ef4444' },
          input: { color: '#374151' },
        },
      });

      if (!isMountedRef.current) return;

      if (!cardContainerRef.current) {
        throw new Error('Card container not found.');
      }

      // Attach to the empty container div — no children competing with Square's iframe
      await cardInstance.attach(cardContainerRef.current);

      if (isMountedRef.current) {
        setCard(cardInstance);
        setIsInitialized(true);
        setScriptLoading(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setInitError(`Failed to initialize payment form: ${error.message}`);
        setScriptLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!card || !isInitialized) return;

    try {
      const result = await card.tokenize();

      if (result.status === 'OK') {
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
    initializeSquare();
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

        {/* Loading state rendered OUTSIDE and ABOVE the container,
            so Square's iframe always attaches to an empty div */}
        {(scriptLoading || !isInitialized) && (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{
              minHeight: '96px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              marginBottom: '4px',
            }}
          >
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted">Loading payment form...</span>
          </div>
        )}

        {/* This div must always be rendered and always stay empty —
            Square attaches its iframe directly into it */}
        <div
          ref={cardContainerRef}
          id="credit-card-container"
          style={{
            // Hide (but keep mounted) until Square has attached, so there
            // is no gap/flash between the spinner disappearing and the
            // iframe appearing.
            display: isInitialized ? 'block' : 'none',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
          }}
        />

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