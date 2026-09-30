import React, { useState, useEffect, useRef } from 'react';

// Square Web Payments SDK card form. Card details go straight to Square, which returns a
// one-time token; the parent sends that token to our server (POST /api/checkout/square),
// and the server charges the amount it calculated itself.
//
// Config comes from client/.env.*:
//   REACT_APP_SQUARE_APPLICATION_ID, REACT_APP_SQUARE_LOCATION_ID,
//   REACT_APP_SQUARE_ENVIRONMENT ("production" for live; anything else = sandbox)

const APPLICATION_ID = process.env.REACT_APP_SQUARE_APPLICATION_ID;
const LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID;
const IS_PRODUCTION = (process.env.REACT_APP_SQUARE_ENVIRONMENT || '').toLowerCase().includes('production');
const SDK_URL = IS_PRODUCTION
  ? 'https://web.squarecdn.com/v1/square.js'
  : 'https://sandbox.web.squarecdn.com/v1/square.js';

const loadSquareSdk = () => {
  if (window.Square) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SDK_URL}"]`);
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    script.addEventListener('load', resolve);
    script.addEventListener('error', () => reject(new Error('Failed to load the Square payment SDK')));
    if (!existing) {
      script.src = SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });
};

const SquarePaymentForm = ({
  amount,            // dollars, for display only — the server decides what is charged
  onTokenReceived,   // ({ token, idempotencyKey }) => Promise
  disabled = false,
}) => {
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef(null);
  const cardInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeSquare = async () => {
      if (!APPLICATION_ID || !LOCATION_ID) {
        setStatus('❌ Card payments are not configured.');
        return;
      }
      try {
        setStatus('Loading secure card form...');
        await loadSquareSdk();

        const payments = window.Square.payments(APPLICATION_ID, LOCATION_ID);
        const card = await payments.card();

        if (!isMounted || !containerRef.current) {
          card.destroy();
          return;
        }
        await card.attach(containerRef.current);
        cardInstanceRef.current = card;
        setReady(true);
        setStatus(IS_PRODUCTION ? '' : 'Sandbox mode • Test card: 4111 1111 1111 1111');
      } catch (error) {
        console.error('Square init error:', error);
        if (isMounted) setStatus('❌ Failed to load the payment form.');
      }
    };

    initializeSquare();

    // Destroying the card on unmount stops React Strict Mode's double-mount from
    // leaving two card forms in the page.
    return () => {
      isMounted = false;
      cardInstanceRef.current?.destroy();
      cardInstanceRef.current = null;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardInstanceRef.current || disabled || isProcessing) return;

    setIsProcessing(true);
    setStatus('Processing payment...');

    try {
      const result = await cardInstanceRef.current.tokenize();

      if (result.status === 'OK') {
        setStatus('');
        await onTokenReceived({
          token: result.token,
          idempotencyKey: crypto.randomUUID?.() || `sq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
      } else {
        setStatus(`❌ ${result.errors?.[0]?.message || 'Please check your card details.'}`);
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      setStatus('❌ An error occurred while reading your card.');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayAmount = Number(amount || 0).toFixed(2);
  const buttonDisabled = !ready || disabled || isProcessing;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '420px',
        margin: '0 auto 24px',
        padding: '24px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        ref={containerRef}
        style={{
          minHeight: '90px',
          marginBottom: '16px',
        }}
      />

      <button
        type="submit"
        disabled={buttonDisabled}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: buttonDisabled ? '#888' : '#00a65a',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: buttonDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isProcessing ? 'Processing...' : `Pay $${displayAmount}`}
      </button>

      {status && (
        <p
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px',
            color: status.startsWith('❌') ? '#d32f2f' : '#555',
          }}
        >
          {status}
        </p>
      )}

      <p style={{ fontSize: '12px', textAlign: 'center', color: '#777', marginTop: '12px' }}>
        Secured by Square{IS_PRODUCTION ? '' : ' • SANDBOX MODE'}
      </p>
    </form>
  );
};

export default SquarePaymentForm;
