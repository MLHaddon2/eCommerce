import Orders from "../models/orderModel.js";
import { handleError } from '../utils/handleError.js';
import { sendMail } from '../utils/mailer.js';
import { ORDER_STATUSES, CARRIERS, shouldNotify, orderStatusEmail } from '../utils/orderStatus.js';

// All routes here are admin-only (see routes/index.js). Customers see their own
// orders through /api/me/orders.

export const getOrders = async (req, res) => {
  try {
    const orders = await Orders.findAll({ order: [['id', 'DESC']] });
    return res.status(200).json(orders);
  } catch (error) {
    return handleError(res, 'Get orders', error);
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    return handleError(res, 'Get order', error);
  }
};

export const createOrder = async (req, res) => {
  const { customerId, orderDate, orderItems, totalAmount, shippingAddress, paymentMethod, orderStatus, customerEmail } = req.body;
  try {
    const order = await Orders.create({
      customerId,
      orderDate,
      orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus,
      customerEmail
    });
    res.status(201).json(order);
  } catch (error) {
    return handleError(res, 'Create order', error);
  }
};

// General edit. Only the fields that are sent are changed.
// (Status changes should go through PATCH /orders/:id/status so they're logged and emailed.)
export const updateOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const editable = ['customerId', 'orderDate', 'orderItems', 'totalAmount', 'shippingAddress',
      'paymentMethod', 'orderStatus', 'customerEmail', 'trackingCarrier', 'trackingNumber'];
    const updates = {};
    for (const field of editable) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    // Older client code sends { status }.
    if (req.body.status !== undefined && updates.orderStatus === undefined) updates.orderStatus = req.body.status;

    await order.update(updates);
    res.status(200).json({ message: "Order updated successfully", updatedOrder: order });
  } catch (error) {
    return handleError(res, 'Update order', error);
  }
};

// PATCH /api/orders/:id/status  { status, trackingCarrier?, trackingNumber?, note? }
// Records the change in statusHistory and emails the customer about shipping,
// delivery, cancellation or refund.
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingCarrier, trackingNumber, note } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    if (trackingCarrier && !CARRIERS.includes(trackingCarrier)) {
      return res.status(400).json({ message: `Carrier must be one of: ${CARRIERS.join(', ')}` });
    }

    const order = await Orders.findOne({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const updates = {};
    if (trackingCarrier !== undefined) updates.trackingCarrier = trackingCarrier || null;
    if (trackingNumber !== undefined) updates.trackingNumber = String(trackingNumber || '').trim().slice(0, 100) || null;

    const statusChanged = status !== order.orderStatus;
    if (statusChanged) {
      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      updates.orderStatus = status;
      updates.statusHistory = [
        ...history,
        { status, date: new Date().toISOString(), ...(note ? { note: String(note).slice(0, 500) } : {}) }
      ];
    }

    await order.update(updates);

    let emailed = false;
    if (statusChanged && shouldNotify(status) && order.customerEmail) {
      await sendMail(orderStatusEmail(order));
      emailed = true;
    }

    res.status(200).json({ message: "Order status updated", updatedOrder: order, emailed });
  } catch (error) {
    return handleError(res, 'Update order status', error);
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({
      where: { id: req.params.id }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    await Orders.destroy({
      where: { id: req.params.id }
    });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    return handleError(res, 'Delete order', error);
  }
};
