import React, { useState, useEffect } from 'react';
import { Table, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from '../../api/axios';

// The logged-in customer's order history (GET /api/me/orders), with status and tracking.

const STATUS_COLORS = {
  Paid: 'primary', Processing: 'info', Shipped: 'warning', Delivered: 'success', Cancelled: 'secondary', Refunded: 'secondary',
};

// Keep in sync with utils/orderStatus.js on the server.
const TRACKING_URLS = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
};

const Tracking = ({ order }) => {
  if (!order.trackingNumber) return null;
  const url = TRACKING_URLS[order.trackingCarrier]?.(order.trackingNumber);
  const label = `${order.trackingCarrier || 'Tracking'} ${order.trackingNumber}`;
  return (
    <div className="small mt-1">
      {url ? <a href={url} target="_blank" rel="noopener noreferrer">{label}</a> : label}
    </div>
  );
};
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/me/orders')
      .then((res) => setOrders(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your orders.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="text-center py-4"><Spinner animation="border" size="sm" /> Loading orders…</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  // orderItems are the checkout quote lines: { name, quantity, ... }
  const itemsSummary = (order) =>
    (Array.isArray(order.orderItems) ? order.orderItems : [])
      .map((item) => `${item.name} × ${item.quantity}`)
      .join(', ');

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Order</th>
          <th>Date</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{new Date(order.orderDate).toLocaleDateString()}</td>
            <td>{itemsSummary(order)}</td>
            <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
            <td>
              <Badge bg={STATUS_COLORS[order.orderStatus] || 'secondary'}>{order.orderStatus}</Badge>
              <Tracking order={order} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default OrdersTab;
