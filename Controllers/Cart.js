import Customer from '../models/customerModel.js';
import GuestCart from '../models/guestCartModel.js';
import IpHistory from '../models/ipHistoryModel.js';
import { handleError } from '../utils/handleError.js';

// Who owns the cart is decided here, on the server — never from URL params:
//   - logged in (optionalAuth attached req.email) → that user's Customer row
//   - otherwise → the GuestCart row for the httpOnly sessionId cookie

const MAX_CART_ITEMS = 100;

const clientIp = (req) => (req.ip || '').replace('::ffff:', '').trim();

const isValidCart = (cartItems) =>
  Array.isArray(cartItems) &&
  cartItems.length <= MAX_CART_ITEMS &&
  cartItems.every((i) => i && i.id !== undefined && Number.isInteger(i.quantity) && i.quantity > 0);

// Returns { cartItems, save(items) } for whoever is making the request.
export const resolveCart = async (req) => {
  if (req.email) {
    const customer = await Customer.findOne({ where: { email: req.email } });
    if (customer) {
      return {
        cartItems: customer.cartItems || [],
        save: (cartItems) => customer.update({ cartItems })
      };
    }
    // Logged-in users without a customer profile (e.g. the admin account)
    // fall through to a session cart.
  }

  const sessionId = req.cookies?.sessionId;
  if (!sessionId) return null;

  // Plain find-then-create: findOrCreate opens a transaction per call, which isn't
  // needed for a row keyed by a random session id.
  const guest = (await GuestCart.findByPk(sessionId))
    || await GuestCart.create({ sessionId, cartItems: [] });
  return {
    cartItems: guest.cartItems || [],
    save: (cartItems) => guest.update({ cartItems })
  };
};

// Keeps the admin panel's IP history populated. Best-effort; never blocks the cart.
const touchIpHistory = (req) => {
  const ip = clientIp(req);
  if (!ip) return;
  const userId = req.userID ? String(req.userID) : '0000';
  IpHistory.findOne({ where: { ipAddress: ip } })
    .then((row) => row
      ? row.update({ lastLogin: new Date() })
      : IpHistory.create({ ipAddress: ip, userId, lastLogin: new Date(), cartItems: [] }))
    .catch((error) => console.error('IP history update failed:', error));
};

/* ---------------------------------------------------------
   GET CART
--------------------------------------------------------- */
export const getCartItems = async (req, res) => {
  try {
    const cart = await resolveCart(req);
    if (!cart) return res.status(200).json({ cartItems: [] });

    touchIpHistory(req);
    return res.status(200).json({ cartItems: cart.cartItems });
  } catch (error) {
    return handleError(res, 'Get cart items', error);
  }
};

/* ---------------------------------------------------------
   REPLACE CART
--------------------------------------------------------- */
export const updateCartItems = async (req, res) => {
  try {
    const { cartItems } = req.body;
    if (!isValidCart(cartItems)) {
      return res.status(400).json({ message: 'cartItems must be an array of { id, quantity } items' });
    }

    const cart = await resolveCart(req);
    if (!cart) return res.status(400).json({ message: 'No session — enable cookies to use the cart' });

    await cart.save(cartItems);
    return res.status(200).json({ cartItems });
  } catch (error) {
    return handleError(res, 'Update cart items', error);
  }
};

/* ---------------------------------------------------------
   DECREMENT / REMOVE ONE ITEM
--------------------------------------------------------- */
export const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await resolveCart(req);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    let items = [...cart.cartItems];
    const index = items.findIndex((i) => String(i.id) === String(productId));
    if (index === -1) return res.status(404).json({ message: 'Product not found' });

    if (items[index].quantity > 1) items[index] = { ...items[index], quantity: items[index].quantity - 1 };
    else items = items.filter((i) => String(i.id) !== String(productId));

    await cart.save(items);
    return res.status(200).json({ cartItems: items });
  } catch (error) {
    return handleError(res, 'Delete cart item', error);
  }
};

/* ---------------------------------------------------------
   MERGE GUEST CART ON LOGIN
--------------------------------------------------------- */
// Called by Login/Register: moves anything the visitor added before logging in
// into their customer cart, then empties the guest cart.
export const mergeGuestCart = async (sessionId, email) => {
  if (!sessionId || !email) return;

  const guest = await GuestCart.findByPk(sessionId);
  const guestItems = guest?.cartItems || [];
  if (guestItems.length === 0) return;

  const customer = await Customer.findOne({ where: { email } });
  if (!customer) return;

  // Clone rather than mutate: Sequelize compares JSON columns against the
  // original objects, so in-place edits can look "unchanged" and skip the save.
  const merged = (customer.cartItems || []).map((i) => ({ ...i }));
  for (const item of guestItems) {
    const existing = merged.find((i) => String(i.id) === String(item.id));
    if (existing) existing.quantity = Math.max(existing.quantity, item.quantity);
    else merged.push({ ...item });
  }

  await customer.update({ cartItems: merged.slice(0, MAX_CART_ITEMS) });
  await guest.update({ cartItems: [] });
};
