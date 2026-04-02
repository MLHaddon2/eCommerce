import Customer from '../models/customerModel.js';
import IpHistory from '../models/ipHistoryModel.js';

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error)
  });
};

// Helper function to merge cart items
const mergeCartItems = (existingItems, newItems) => {
  const merged = [...existingItems];

  newItems.forEach((newItem) => {
    const existingIndex = merged.findIndex((item) => item.id === newItem.id);
    if (existingIndex >= 0) {
      merged[existingIndex].quantity += newItem.quantity;
    } else {
      merged.push(newItem);
    }
  });

  return merged;
};

export const updateCartItems = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.params.id;
    const ipAddress = req.params.ipAddress;
    let finalCartItems = cartItems;

    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const existingCartItems = customer.cartItems || [];
      if (existingCartItems.length > 0) {
        finalCartItems = mergeCartItems(existingCartItems, cartItems);
      }

      await customer.update({ cartItems: finalCartItems });
    }

    await IpHistory.upsert({
      ipAddress,
      lastLogin: new Date().toUTCString(),
      cartItems: finalCartItems,
    });

    return res.status(200).json({ cartItems: finalCartItems });
  } catch (error) {
    return handleError(res, 'Update cart items', error);
  }
};

export const getCartItems = async (req, res) => {
  try {
    const userId = req.params.id;
    const ipAddress = req.params.ipAddress;

    let cartItems = null;

    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      cartItems = customer.cartItems || [];
      return res.status(200).json({ message: 'Cart items retrieved from existing customer', cartItems });
    }

    const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
    if (!ipHistory) {
      return res.status(404).json({ message: 'IP history not found' });
    }
    cartItems = ipHistory.cartItems || [];
    return res.status(200).json({ message: 'Cart items retrieved from IP history', cartItems });
  } catch (error) {
    return handleError(res, 'Get cart items', error);
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const userId = req.params.id;
    const productId = req.params.productId;
    const ipAddress = req.params.ipAddress;
    let cartItems = [];

    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      cartItems = customer.cartItems || [];
    } else {
      const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
      if (!ipHistory) {
        return res.status(404).json({ message: 'IP history not found' });
      }
      cartItems = ipHistory.cartItems || [];
    }

    const existingIndex = cartItems.findIndex((item) => String(item.id) === String(productId));
    if (existingIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    if (cartItems[existingIndex].quantity > 1) {
      cartItems[existingIndex].quantity -= 1;
    } else {
      cartItems = cartItems.filter((item) => String(item.id) !== String(productId));
    }

    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      await customer.update({ cartItems });
      return res.status(200).json({ message: 'Item removed from customer cart', cartItems });
    }

    const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
    await ipHistory.update({ cartItems });
    return res.status(200).json({ message: 'Item removed from IP history cart', cartItems });
  } catch (error) {
    return handleError(res, 'Delete cart item', error);
  }
};