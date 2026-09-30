import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';

// Keep in sync with utils/orderStatus.js on the server.
export const ORDER_STATUSES = ['Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
export const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL'];

// Status + tracking controls for one order in the admin Orders tab.
// Saving calls PATCH /api/orders/:id/status, which logs the change and emails the
// customer when an order ships, is delivered, cancelled or refunded.
function OrderStatusEditor({ order }) {
  const { updateOrderStatus } = useData();
  const [status, setStatus] = useState(order.orderStatus || 'Paid');
  const [carrier, setCarrier] = useState(order.trackingCarrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const dirty =
    status !== (order.orderStatus || 'Paid') ||
    carrier !== (order.trackingCarrier || '') ||
    trackingNumber !== (order.trackingNumber || '');

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateOrderStatus(order.id, status, { trackingCarrier: carrier, trackingNumber });
      setMessage({ ok: true, text: result.emailed ? 'Saved — customer emailed' : 'Saved' });
    } catch (error) {
      setMessage({ ok: false, text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const showTracking = ['Shipped', 'Delivered'].includes(status) || carrier || trackingNumber;

  return (
    <div style={{ minWidth: 190 }}>
      <Form.Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Order status">
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </Form.Select>
      {showTracking && (
        <>
          <Form.Select size="sm" className="mt-1" value={carrier} onChange={(e) => setCarrier(e.target.value)} aria-label="Carrier">
            <option value="">Carrier…</option>
            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
          <Form.Control
            size="sm"
            className="mt-1"
            placeholder="Tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </>
      )}
      <Button size="sm" className="mt-1 w-100" disabled={!dirty || saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
      {message && (
        <small className={message.ok ? 'text-success' : 'text-danger'}>{message.text}</small>
      )}
    </div>
  );
}

export default OrderStatusEditor;
