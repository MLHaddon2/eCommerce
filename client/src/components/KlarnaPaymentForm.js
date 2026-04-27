import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../api/axios';

const KLARNA_SESSION_ENDPOINT = '/api/payments/klarna/session';
const KLARNA_AUTHORIZE_ENDPOINT = '/api/payments/klarna/authorize';

/**
 * KlarnaPaymentForm
 * Props:
 *   amount        {number}   — final total in dollars (e.g. 49.99)
 *   items         {Array}    — [{ id, quantity, name, price }]
 *   shippingState {string}   — 2-letter US state code
 *   onSuccess     {Function} — called with { order_id } on successful authorization
 *   onError       {Function} — called with an error message string
 */
const KlarnaPaymentForm = ({ amount, items, shippingState, onSuccess, onError }) => {
    const [status, setStatus] = useState('idle'); // idle | loading | ready | processing | error
    const [errorMsg, setErrorMsg] = useState('');
    const containerRef = useRef(null);
    const sessionRef = useRef(null); // { client_token, session_id, payment_method_categories }

    // ── 1. Load Klarna SDK script ────────────────────────────────────────────
    const loadKlarnaSDK = () =>
        new Promise((resolve, reject) => {
            if (window.Klarna) return resolve();
            const script = document.createElement('script');
            script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Klarna SDK'));
            document.head.appendChild(script);
        });

    // ── 2. Create session on the server, then initialize the widget ──────────
    useEffect(() => {
        if (!items || items.length === 0) return;

        let cancelled = false;

        const init = async () => {
            setStatus('loading');
            setErrorMsg('');

            try {
                await loadKlarnaSDK();

                const { data } = await axios.post(KLARNA_SESSION_ENDPOINT, {
                    currency: 'USD',
                    shippingState,
                    items,
                });

                if (!data.success) throw new Error(data.message || 'Session creation failed');

                sessionRef.current = data;

                if (cancelled) return;

                // Initialize Klarna Payments with the client_token
                window.Klarna.Payments.init({ client_token: data.client_token });

                // Load the payment widget into the container div
                window.Klarna.Payments.load(
                    {
                        container: containerRef.current,
                        payment_method_category:
                            data.payment_method_categories?.[0]?.identifier || 'pay_later',
                    },
                    (res) => {
                        if (cancelled) return;
                        if (res.show_form) {
                            setStatus('ready');
                        } else {
                            setStatus('error');
                            setErrorMsg('Klarna is not available for this order.');
                            onError?.('Klarna is not available for this order.');
                        }
                    }
                );
            } catch (err) {
                if (cancelled) return;
                console.error('Klarna init error:', err);
                const msg = err.message || 'Could not initialize Klarna';
                setStatus('error');
                setErrorMsg(msg);
                onError?.(msg);
            }
        };

        init();
        return () => { cancelled = true; };
    // Re-initialize if items or shippingState change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shippingState, JSON.stringify(items)]);

    // ── 3. Authorize ─────────────────────────────────────────────────────────
    const handleAuthorize = () => {
        if (!window.Klarna || status !== 'ready') return;

        setStatus('processing');
        setErrorMsg('');

        window.Klarna.Payments.authorize(
            { payment_method_category: sessionRef.current?.payment_method_categories?.[0]?.identifier || 'pay_later' },
            {},
            async (res) => {
                if (!res.approved) {
                    const msg = res.error?.invalid_fields?.join(', ') || 'Klarna authorization was not approved.';
                    setStatus('ready');
                    setErrorMsg(msg);
                    onError?.(msg);
                    return;
                }

                try {
                    const orderLines = items.map((item) => ({
                        type: 'physical',
                        name: item.name,
                        quantity: item.quantity,
                        unit_price: Math.round(item.price * 100),
                        total_amount: Math.round(item.price * item.quantity * 100),
                        tax_rate: 0,
                        total_tax_amount: 0,
                    }));

                    const { data } = await axios.post(KLARNA_AUTHORIZE_ENDPOINT, {
                        authorization_token: res.authorization_token,
                        order_amount: Math.round(amount * 100),
                        order_lines: orderLines,
                        currency: 'USD',
                    });

                    if (data.success) {
                        onSuccess?.({ order_id: data.order_id, fraud_status: data.fraud_status });
                    } else {
                        throw new Error(data.message || 'Authorization failed on server');
                    }
                } catch (err) {
                    console.error('Klarna server authorize error:', err);
                    const msg = err.response?.data?.message || err.message || 'Klarna payment failed.';
                    setStatus('ready');
                    setErrorMsg(msg);
                    onError?.(msg);
                }
            }
        );
    };

    return (
        <div style={{ maxWidth: 420 }}>
            {/* Klarna mounts its widget here */}
            <div
                ref={containerRef}
                style={{
                    minHeight: status === 'ready' || status === 'processing' ? 120 : 0,
                    marginBottom: 16,
                }}
            />

            {status === 'loading' && (
                <div className="d-flex align-items-center gap-2 mb-3">
                    <Spinner animation="border" size="sm" />
                    <span className="text-muted">Loading Klarna…</span>
                </div>
            )}

            {status === 'error' && errorMsg && (
                <Alert variant="danger" className="mb-3">{errorMsg}</Alert>
            )}

            {(status === 'ready' || status === 'processing') && (
                <>
                    {errorMsg && (
                        <Alert variant="warning" className="mb-2">{errorMsg}</Alert>
                    )}
                    <Button
                        onClick={handleAuthorize}
                        disabled={status === 'processing'}
                        variant="primary"
                        size="lg"
                        className="w-100"
                        style={{ backgroundColor: '#ffb3c7', borderColor: '#ffb3c7', color: '#000' }}
                    >
                        {status === 'processing'
                            ? 'Processing…'
                            : `Pay $${amount.toFixed(2)} with Klarna`}
                    </Button>
                </>
            )}
        </div>
    );
};

export default KlarnaPaymentForm;
