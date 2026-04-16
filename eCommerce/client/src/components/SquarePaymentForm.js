import React, { useState, useEffect, useRef } from 'react';

const SquarePaymentForm = ({
  applicationId = 'sandbox-sq0idb-yQknbhfzkE_oLYjaXeNKPQ',
  locationId = 'LWA9Q5KARMH1J',

  amount,          // cents → change this as needed
  currency = 'USD',

  onTokenReceived = null,
}) => {
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef(null);
  const cardInstanceRef = useRef(null);
  const paymentsInstanceRef = useRef(null);

  useEffect(() => {
    console.log('🔧 Square Sandbox initialized with:', { applicationId, locationId });

    let isMounted = true;

    const initializeSquare = async () => {
      try {
        setStatus('Loading Square Sandbox...');

        if (!window.Square) {
          const script = document.createElement('script');
          script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
          script.async = true;
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Square Sandbox SDK'));
          });
        }

        const payments = window.Square.payments(applicationId, locationId);
        paymentsInstanceRef.current = payments;

        const card = await payments.card();
        if (containerRef.current && isMounted) {
          await card.attach(containerRef.current);
          cardInstanceRef.current = card;
          setStatus('✅ Sandbox card form ready • Test card: 4111 1111 1111 1111');
        }
      } catch (error) {
        console.error('Square init error:', error);
        setStatus('❌ Failed to load payment form. Check console.');
      }
    };

    initializeSquare();

    return () => { isMounted = false; };
  }, [applicationId, locationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardInstanceRef.current) return;

    setIsProcessing(true);
    setStatus('Processing payment in sandbox...');

    try {
      const result = await cardInstanceRef.current.tokenize();

      if (result.status === 'OK') {
        console.log('✅ Square token received:', result.token);
        setStatus('✅ Token received successfully!');

        if (onTokenReceived) {
          onTokenReceived({
            token: result.token,
            amount,
            currency,
            idempotencyKey: crypto.randomUUID?.() || `sq-${Date.now()}`,
            environment: 'sandbox',
          });
        }
      } else {
        setStatus(`❌ Tokenization failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      setStatus('❌ An error occurred during tokenization');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayAmount = amount.toFixed(2);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '420px',
        margin: '40px auto',
        padding: '24px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ marginTop: 0, textAlign: 'center', color: '#00a65a' }}>
        Pay ${displayAmount} (Sandbox Mode)
      </h2>

      <div
        ref={containerRef}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '12px',
          minHeight: '160px',
          marginBottom: '24px',
          backgroundColor: '#fafafa',
        }}
      />

      <button
        type="submit"
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: isProcessing ? '#666' : '#00a65a',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
        }}
      >
        {isProcessing ? 'Processing in Sandbox...' : `Pay $${displayAmount} Securely`}
      </button>

      {status && (
        <p
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px',
            color: status.includes('✅') ? '#00a65a' : '#d32f2f',
          }}
        >
          {status}
        </p>
      )}

      <p style={{ fontSize: '12px', textAlign: 'center', color: '#777', marginTop: '20px' }}>
        Secured by Square • SANDBOX MODE
      </p>
    </form>
  );
};

export default SquarePaymentForm;