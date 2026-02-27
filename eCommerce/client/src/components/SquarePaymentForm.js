import React, { useEffect, useRef, useState } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';

const SquarePaymentForm = ({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError, 
  loading = false,
  disabled = false 
}) => {
  const [payments, setPayments] = useState(null);
  const [card, setCard] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);
  const cardContainerRef = useRef(null);
  const scriptRef = useRef(null);
  const initializeRef = useRef(false);

  // Square configuration
  const SQUARE_APPLICATION_ID = process.env.REACT_APP_SQUARE_APPLICATION_ID;
  const SQUARE_LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID;
  const SQUARE_ENVIRONMENT = process.env.REACT_APP_SQUARE_ENVIRONMENT || 'sandbox';

  const getSquareScriptUrl = () => {
    // Fixed: Corrected URLs and logic
    return SQUARE_ENVIRONMENT === 'production' 
      ? 'https://web.squarecdn.com/v1/square.js'  // Production URL
      : 'https://sandbox.web.squarecdn.com/v1/square.js'; // Sandbox URL
  };

  useEffect(() => {
    // Only initialize if not already done
    if (!initializeRef.current) {
      loadSquareScript();
    }

    // Cleanup function
    return () => {
      // Clean up the card instance
      if (card) {
        try {
          card.destroy();
        } catch (error) {
          console.log('Error destroying card instance:', error);
        }
      }
      
      // Clean up script if we created it
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      
      // Reset initialization flag on unmount
      initializeRef.current = false;
    };
  }, []); // Empty dependency array to run only once

  const loadSquareScript = async () => {
    try {
      // Prevent multiple initialization attempts
      if (initializeRef.current) {
        return;
      }

      setScriptLoading(true);
      setInitError('');

      // Validate required environment variables
      if (!SQUARE_APPLICATION_ID || !SQUARE_LOCATION_ID) {
        throw new Error('Square Application ID and Location ID must be configured in environment variables');
      }

      // Check if Square is already loaded
      if (window?.Square) {
        await initializeSquarePayments();
        return;
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector(`script[src="${getSquareScriptUrl()}"]`);
      if (existingScript) {
        if (window?.Square) {
          await initializeSquarePayments();
        } else {
          existingScript.addEventListener('load', initializeSquarePayments);
        }
        return;
      }

      // Avoid loading script multiple times
      if (scriptRef.current) {
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = getSquareScriptUrl();
      script.async = true;
      scriptRef.current = script;
      
      script.onload = async () => {
        try {
          if (!initializeRef.current) {
            await initializeSquarePayments();
          }
        } catch (error) {
          console.error('Error initializing Square payments after script load:', error);
          setInitError(`Failed to initialize Square payments: ${error.message}`);
          setScriptLoading(false);
        }
      };
      
      script.onerror = (error) => {
        console.error('Script loading error:', error);
        setInitError('Failed to load Square Payment SDK. Please check your internet connection and try again.');
        setScriptLoading(false);
        scriptRef.current = null;
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Square script:', error);
      setInitError(`Failed to initialize Square payments: ${error.message}`);
      setScriptLoading(false);
    }
  };

  const initializeSquarePayments = async () => {
    try {
      if (initializeRef.current) {
        return; // Already initialized
      }

      // Set flag immediately to prevent race conditions
      initializeRef.current = true;

      if (!window?.Square) {
        initializeRef.current = false;
        throw new Error('Square SDK not loaded');
      }

      console.log('Initializing Square payments...', {
        applicationId: SQUARE_APPLICATION_ID?.substring(0, 8) + '...',
        locationId: SQUARE_LOCATION_ID?.substring(0, 8) + '...',
        environment: SQUARE_ENVIRONMENT
      });

      // Initialize Square payments
      const paymentsInstance = window.Square.payments(
        SQUARE_APPLICATION_ID,
        SQUARE_LOCATION_ID
      );

      if (!paymentsInstance) {
        initializeRef.current = false;
        throw new Error('Failed to create Square payments instance');
      }

      setPayments(paymentsInstance);

      // Create and attach card payment method with only supported CSS properties
      const cardInstance = await paymentsInstance.card({
        style: {
          '.input-container.is-focus': {
            borderColor: '#3b82f6'
          },
          '.input-container.is-error': {
            borderColor: '#ef4444'
          },
          '.message-text': {
            color: '#ef4444'
          },
          '.message-icon': {
            color: '#ef4444'
          },
          'input': {
            color: '#374151'
          }
        }
      });

      if (!cardInstance) {
        initializeRef.current = false;
        throw new Error('Failed to create card instance');
      }

      // Attach the card to the container
      if (cardContainerRef.current) {
        // Check if already attached to prevent duplicate forms
        const existingForm = cardContainerRef.current.querySelector('.sq-input');
        if (existingForm) {
          console.log('Square form already attached, skipping...');
          setCard(cardInstance);
          setIsInitialized(true);
          setScriptLoading(false);
          return;
        }

        await cardInstance.attach(cardContainerRef.current);
        setCard(cardInstance);
        setIsInitialized(true);
        setScriptLoading(false);
        console.log('Square payments initialized successfully');
      } else {
        initializeRef.current = false;
        throw new Error('Card container not found');
      }

    } catch (error) {
      console.error('Error initializing Square payments:', error);
      initializeRef.current = false;
      setInitError(`Failed to initialize Square payments: ${error.message}`);
      setScriptLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!card) {
      onPaymentError('Payment form not ready. Please try again.');
      return;
    }

    if (!isInitialized) {
      onPaymentError('Payment system is still loading. Please wait and try again.');
      return;
    }

    try {
      console.log('Starting payment tokenization...');
      
      // Tokenize the card
      const result = await card.tokenize();
      
      console.log('Tokenization result:', result);
      
      if (result.status === 'OK') {
        console.log('Payment tokenization successful');
        // Pass the token to parent component
        onPaymentSuccess({
          token: result.token,
          details: result.details
        });
      } else {
        // Handle tokenization errors
        console.error('Tokenization errors:', result.errors);
        const errorMessage = result.errors?.[0]?.message || 'Payment failed. Please check your card details and try again.';
        onPaymentError(errorMessage);
      }
    } catch (error) {
      console.error('Square payment error:', error);
      onPaymentError('An error occurred while processing your payment. Please try again.');
    }
  };

  // Show environment info for debugging (remove in production)
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div className="mb-2">
      <small className="text-muted">
        Environment: {SQUARE_ENVIRONMENT} | 
        App ID: {SQUARE_APPLICATION_ID ? '✓' : '✗'} | 
        Location ID: {SQUARE_LOCATION_ID ? '✓' : '✗'}
      </small>
    </div>
  ) : null;

  if (initError) {
    return (
      <div>
        {debugInfo}
        <Alert variant="danger">
          <strong>Payment Error:</strong> {initError}
          <br />
          <small>Please refresh the page and try again, or contact support if the problem persists.</small>
          <div className="mt-2">
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => {
                setInitError('');
                setIsInitialized(false);
                initializeRef.current = false;
                loadSquareScript();
              }}
            >
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="square-payment-form">
      {debugInfo}
      
      <div className="mb-3">
        <label className="form-label">Card Information</label>
        <div 
          ref={cardContainerRef}
          id="square-card-container"
          style={{
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff'
          }}
        >
          {(scriptLoading || !isInitialized) && !initError && (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '96px' }}>
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">
                {scriptLoading ? 'Loading payment form...' : 'Initializing payment form...'}
              </span>
            </div>
          )}
        </div>
        {isInitialized && (
          <small className="form-text text-muted">
            <i className="fas fa-shield-alt me-1"></i>
            Secure payment processing powered by Square
          </small>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-100"
        onClick={handlePayment}
        disabled={!isInitialized || loading || disabled || scriptLoading}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              className="me-2"
            />
            Processing Payment...
          </>
        ) : scriptLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              className="me-2"
            />
            Loading...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>

      <div className="mt-2 text-center">
        <small className="text-muted">
          <i className="fas fa-lock me-1"></i>
          Your payment information is secure and encrypted
        </small>
      </div>
    </div>
  );
};

export default SquarePaymentForm;