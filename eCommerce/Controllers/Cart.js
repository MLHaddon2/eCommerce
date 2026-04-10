// import { where } from 'sequelize';
// import Customer from '../models/customerModel.js';
// import IpHistory from '../models/ipHistoryModel.js';

// const handleError = (res, context, error) => {
//   console.error(context, error);
//   return res.status(500).json({
//     message: `${context} failed`,
//     error: error?.message || String(error)
//   });
// };

// const mergeCartItems = (existingItems = [], newItems = []) => {
//   const merged = [...existingItems];

//   newItems.forEach((newItem) => {
//     const index = merged.findIndex((item) => String(item.id) === String(newItem.id));
//     if (index >= 0) {
//       merged[index].quantity = (merged[index].quantity || 0) + (newItem.quantity || 1);
//     } else {
//       merged.push({ ...newItem, quantity: newItem.quantity || 1 });
//     }
//   });

//   return merged;
// };

// export const updateCartItems = async (req, res) => {
//   try {
//     const cartItems = req.body;
//     const userId = req.params.id !== '0000' ? req.params.id : '0000';
//     const ipProxy = req.params.ipAddress;

//     let finalCartItems = cartItems;

//     if (userId !== '0000') {
//       const customer = await Customer.findOne({ where: { id: userId } });
//       if (!customer) return res.status(404).json({ message: 'Customer not found' });

//       await Customer.update({ cartItems: finalCartItems }, { where: { id: userId } });
//     } else {
//       const ipRecord = await IpHistory.findOne({ where: { ipAddress: ipProxy } });
//       if (ipRecord) {
//         await IpHistory.update({
//           ipAddress: ipProxy,
//           lastLogin: new Date().toUTCString(),
//           cartItems: finalCartItems
//         }, { where: { ipAddress: ipProxy } });
//       }
//     }

//     return res.status(200).json({ cartItems: finalCartItems });

//   } catch (error) {
//     return handleError(res, 'Update cart items', error);
//   }
// };

// export const getCartItems = async (req, res) => {
//   try {
//     const userId = req.params.id && req.params.id !== '0000' ? req.params.id : '0000';
//     const ipProxy = req.params.ipAddress || req.params.id;

//     // Validate IP address presence
//     if (!ipProxy) {
//       return res.status(400).json({ message: 'IP address is required' });
//     }
//     // If user is authenticated, try to get cart from customer record
//     const ipHistory = await IpHistory.findOne({ where: { ipAddress: ipProxy } });
//     // If no IP history exists, create one for this IP (for guests)
//     if (!ipHistory && userId === '0000') {
//       await IpHistory.create({
//         ipAddress: ipProxy,
//         userId,
//         lastLogin: null,
//         cartItems: []
//       });
//       const newIpHistory = await IpHistory.findOne({ where: { ipAddress: ipProxy } });
//       return res.status(204).json({ message: 'IP history not found, created new record', newIpHistory});
//       // If user is authenticated but no IP history exists, try to find a record tied to this user
//     } else if (userId !== '0000' || ipHistory) {
//         // If user is authenticated and IP history exists, or if user is authenticated and no IP history exists but we find one tied to the user, return cart items from customer record
//         if (userId !== '0000') {
//           const customer = await Customer.findOne({ where: { id: userId } });
//           if (!customer) return res.status(404).json({ message: 'Customer not found' });

//           const newIpReturn = await IpHistory.update(
//             { ipAddress: ipProxy, userId, lastLogin: new Date().toUTCString(), cartItems: customer.cartItems || [] },
//             { where: { ipAddress: ipProxy } }
//           );

//           return res.status(200).json({
//             message: 'Cart items retrieved from existing customer',
//             message2: 'IP history updated with new IP',
//             newIpHistory: newIpReturn.dataValues.ipAddress,
//             cartItems: customer.cartItems || []
//           });
//       };
//       // If user is not authenticated and IP history exists, return cart items from IP history
//       await IpHistory.update(
//         { ipAddress: ipProxy, userId, lastLogin: new Date().toUTCString(), cartItems: ipHistory.cartItems || [] },
//         // TODO: The update causes a 500 error asking for the "id" stating that its undefined. This is because the update is expecting an id parameter, but it is not being passed in the request. The update should be updated to handle the case where the id parameter is not provided, and it should use the ipAddress to identify the user instead.
//         { where: { ipAddress: ipProxy } }
//       );
//       const newIpHistory = await IpHistory.findOne({ where: { ipAddress: ipProxy } });
//       return res.status(200).json({ message: 'IP history updated with new IP', newIpHistory});
//     };

//   } catch (error) {
//     return handleError(res, 'Get cart items', error);
//   }
// };

// export const deleteCartItem = async (req, res) => {
//   try {
//     const userId = req.params.id && req.params.id !== '0000' ? req.params.id : '0000';
//     const productId = req.params.productId;
//     const ipAddress = req.params.ipAddress;

//     if (userId !== '0000') {
//       const customer = await Customer.findOne({ where: { id: userId } });
//       if (!customer) return res.status(404).json({ message: 'Customer not found' });

//       let cartReturn = customer.cartItems || [];
//       const index = cartReturn.findIndex((item) => String(item.id) === String(productId));
//       if (index === -1) return res.status(404).json({ message: 'Product not found in cart' });

//       if (cartReturn[index].quantity > 1) {
//         cartReturn[index].quantity -= 1;
//       } else {
//         cartReturn = cartReturn.filter((item) => String(item.id) !== String(productId));
//       }

//       await customer.update({ cartItems: cartReturn });
//       await persistIpHistory(userId, ipAddress, cartReturn);

//       return res.status(200).json({ message: 'Item removed from customer cart', cartReturn });
//     }

//     if (userId === '0000') {
//       const ipHistory = await IpHistory.findOne({ where: { ipAddress } });
//       if (!ipHistory) return res.status(404).json({ message: 'IP history not found' });

//       let cartReturn = ipHistory.cartItems || [];
//       const index = cartItems.findIndex((item) => String(item.id) === String(productId));
//       if (index === -1) return res.status(404).json({ message: 'Product not found in cart' });

//       if (cartReturn[index].quantity > 1) {
//         cartReturn[index].quantity -= 1;
//       } else {
//         cartReturn = cartReturn.filter((item) => String(item.id) !== String(productId));
//       }

//       await ipHistory.update({ cartItems: cartReturn });

//       return res.status(200).json({ message: 'Item removed from IP history cart', cartReturn });
//     }

//   } catch (error) {
//     return handleError(res, 'Delete cart item', error);
//   }
// };


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
