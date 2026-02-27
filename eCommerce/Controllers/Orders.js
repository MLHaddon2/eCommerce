import Orders from "../models/orderModel.js";

export const getOrders = async (req, res) => {
  try {
    const orders = await Orders.findAll({
      attributes: ['id', 'customerId', 'orderDate', 'orderItems', 'totalAmount', 'shippingAddress', 'paymentMethod', 'orderStatus']
    });
    res.json(orders);
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ message: "Internal server error getting ALL orders", error });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'customerId', 'orderDate', 'orderItems', 'totalAmount', 'shippingAddress', 'paymentMethod', 'orderStatus']
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error('Error in getOrder:', error);
    res.status(500).json({ message: "Internal server error getting order", error });
  }
};

export const createOrder = async (req, res) => {
  const { customerId, orderDate, orderItems, totalAmount, shippingAddress, paymentMethod, orderStatus } = req.body;
  try {
    const order = await Orders.create({
      customerId,
      orderDate,
      orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus
    });
    res.status(201).json(order);
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: "Internal server error creating order", error });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({
      where: { id: req.body.id }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    const { customerId, orderDate, totalAmount, shippingAddress, paymentMethod, orderStatus } = req.body;
    const updatedOrder = await Orders.update({
      customerId,
      orderDate,
      orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus
    }, {
      where: { id: order.id }
    });
    res.status(200).json({ message: "Order updated successfully", updatedOrder });
  } catch (error) {
    console.error('Error in updateOrder:', error);
    res.status(500).json({ message: "Internal server error updating order", error });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Orders.findOne({
      where: { id: req.body.id }
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    await Orders.destroy({
      where: { id: req.body.id }
    });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    res.status(500).json({ message: "Internal server error deleting order", error });
  }
};