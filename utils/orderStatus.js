// Order lifecycle, carrier tracking links and customer emails.

export const ORDER_STATUSES = ['Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];

// Statuses the customer is emailed about.
const NOTIFY_ON = new Set(['Shipped', 'Delivered', 'Cancelled', 'Refunded']);

const TRACKING_URLS = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
};
export const CARRIERS = Object.keys(TRACKING_URLS);

export const trackingUrl = (carrier, number) =>
  carrier && number && TRACKING_URLS[carrier] ? TRACKING_URLS[carrier](number) : null;

const money = (amount) => `$${Number(amount).toFixed(2)}`;

const itemLines = (order) =>
  (Array.isArray(order.orderItems) ? order.orderItems : [])
    .map((i) => `  ${i.name} × ${i.quantity} — ${money((i.lineTotalCents ?? 0) / 100)}`)
    .join('\n');

export const orderConfirmationEmail = (order) => ({
  to: order.customerEmail,
  subject: `Order #${order.id} confirmed`,
  text: [
    `Thanks for your order!`,
    ``,
    `Order #${order.id} — ${new Date(order.orderDate).toLocaleString('en-US')}`,
    itemLines(order),
    ``,
    `Total charged: ${money(order.totalAmount)} (${order.paymentMethod})`,
    order.shippingAddress ? `Shipping to: ${order.shippingAddress}` : null,
    ``,
    `We'll email you again when it ships.`,
  ].filter((line) => line !== null).join('\n'),
});

export const shouldNotify = (status) => NOTIFY_ON.has(status);

export const orderStatusEmail = (order) => {
  const link = trackingUrl(order.trackingCarrier, order.trackingNumber);
  const lines = {
    Shipped: [
      `Good news — order #${order.id} is on its way.`,
      order.trackingNumber ? `Tracking: ${order.trackingCarrier || ''} ${order.trackingNumber}`.trim() : null,
      link ? `Track it: ${link}` : null,
    ],
    Delivered: [`Order #${order.id} has been delivered. Enjoy!`],
    Cancelled: [`Order #${order.id} has been cancelled. If you were charged, a refund will follow.`],
    Refunded: [`Order #${order.id} has been refunded (${money(order.totalAmount)}). It can take a few days to appear.`],
  }[order.orderStatus] || [`Order #${order.id} is now: ${order.orderStatus}.`];

  return {
    to: order.customerEmail,
    subject: `Order #${order.id}: ${order.orderStatus}`,
    text: [...lines, ``, itemLines(order)].filter((line) => line !== null).join('\n'),
  };
};
