import Customer from '../models/customerModel.js';
import IpHistory from '../models/ipHistoryModel.js';

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error)
  });
};

const normalizeIp = (ip) => ip.replace('::ffff:', '').trim();

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

const findOrCreateGuestIp = async (ip) => {
  let record = await IpHistory.findOne({ where: { ipAddress: ip } });

  if (!record) {
    record = await IpHistory.create({
      ipAddress: ip,
      userId: '0000',
      lastLogin: new Date(),
      cartItems: []
    });
  }

  return record;
};

/* ---------------------------------------------------------
   UPDATE CART
--------------------------------------------------------- */

export const updateCartItems = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const rawIp = req.params.ipAddress;
    const ipAddress = normalizeIp(rawIp);
    const userId = req.params.userId;
    console.log('Received update cart request:', { userId, ipAddress, cartItems });

    // USER CART
    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      await Customer.update({ cartItems }, { where: { id: userId } });

      // Sync IP history to match customer cart
      await IpHistory.upsert({
        ipAddress,
        userId,
        lastLogin: new Date(),
        cartItems
      });

      return res.status(200).json({ cartItems });
    }


    // GUEST CART
    const ipRecord = await findOrCreateGuestIp(ipAddress);
    await ipRecord.update({
      cartItems,
      lastLogin: new Date()
    });

    return res.status(200).json({ cartItems });

  } catch (error) {
    return handleError(res, 'Update cart items', error);
  }
};

/* ---------------------------------------------------------
   GET CART
--------------------------------------------------------- */

export const getCartItems = async (req, res) => {
  try {
    const rawIp = req.params.ipAddress;
    const ipAddress = normalizeIp(rawIp);
    const userId = req.params.userId;

    // USER CART
    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      // Sync IP history
      await IpHistory.upsert({
        ipAddress,
        userId,
        lastLogin: new Date(),
        cartItems: customer.cartItems || []
      });

      return res.status(200).json({
        cartItems: customer.cartItems || []
      });
    }

    // GUEST CART
    const ipRecord = await findOrCreateGuestIp(ipAddress);

    return res.status(200).json({
      cartItems: ipRecord.cartItems || []
    });

  } catch (error) {
    return handleError(res, 'Get cart items', error);
  }
};

/* ---------------------------------------------------------
   DELETE ITEM
--------------------------------------------------------- */

export const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const rawIp = req.params.ipAddress;
    const ipAddress = normalizeIp(rawIp);
    const userId = req.params.userId;

    // USER CART
    if (userId !== '0000') {
      const customer = await Customer.findOne({ where: { id: userId } });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      let cart = customer.cartItems || [];
      const index = cart.findIndex((i) => String(i.id) === String(productId));
      if (index === -1) return res.status(404).json({ message: 'Product not found' });

      if (cart[index].quantity > 1) cart[index].quantity -= 1;
      else cart = cart.filter((i) => String(i.id) !== String(productId));

      await customer.update({ cartItems: cart });

      await IpHistory.upsert({
        ipAddress,
        userId,
        lastLogin: new Date(),
        cartItems: cart
      });

      return res.status(200).json({ cartItems: cart });
    }

    // GUEST CART
    const ipRecord = await findOrCreateGuestIp(ipAddress);
    let cart = ipRecord.cartItems || [];

    const index = cart.findIndex((i) => String(i.id) === String(productId));
    if (index === -1) return res.status(404).json({ message: 'Product not found' });

    if (cart[index].quantity > 1) cart[index].quantity -= 1;
    else cart = cart.filter((i) => String(i.id) !== String(productId));

    await ipRecord.update({ cartItems: cart });

    return res.status(200).json({ cartItems: cart });

  } catch (error) {
    return handleError(res, 'Delete cart item', error);
  }
};
