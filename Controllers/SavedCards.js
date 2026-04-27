import Customer from '../models/customerModel.js';

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error),
  });
};

/**
 * GET /api/user/saved-cards
 * Returns the saved cards for the authenticated customer.
 * Each card is stored as a processor-vault reference (never raw PAN data).
 * Shape per card: { id, brand, last4, expMonth, expYear, isDefault }
 */
export const getSavedCards = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.userID },
      attributes: ['id', 'savedCards'],
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const cards = customer.savedCards || [];
    res.status(200).json({ cards });
  } catch (error) {
    return handleError(res, 'Get saved cards', error);
  }
};

/**
 * POST /api/user/saved-cards
 * Saves a new card reference for the authenticated customer.
 *
 * Expected body:
 *   { processorCardId, brand, last4, expMonth, expYear, setAsDefault? }
 *
 * processorCardId is a token/vault-id returned by the payment processor
 * (e.g. Square card-on-file ID, Stripe PaymentMethod ID). Raw card data
 * must NEVER be sent here — the processor SDK handles tokenisation on the
 * client before this endpoint is called.
 */
export const addSavedCard = async (req, res) => {
  try {
    const { processorCardId, brand, last4, expMonth, expYear, setAsDefault = false } = req.body;

    if (!processorCardId || !brand || !last4 || !expMonth || !expYear) {
      return res.status(400).json({ message: 'Missing required card fields' });
    }

    const customer = await Customer.findOne({ where: { id: req.userID } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const existingCards = customer.savedCards || [];

    // Prevent duplicate vault references
    if (existingCards.some((c) => c.processorCardId === processorCardId)) {
      return res.status(409).json({ message: 'Card already saved' });
    }

    const newCard = {
      id: crypto.randomUUID(),
      processorCardId,
      brand,
      last4,
      expMonth,
      expYear,
      isDefault: setAsDefault || existingCards.length === 0, // first card is always default
    };

    // If this card should be default, demote all others
    const updatedCards = setAsDefault
      ? [...existingCards.map((c) => ({ ...c, isDefault: false })), newCard]
      : [...existingCards, newCard];

    await customer.update({ savedCards: updatedCards });
    res.status(201).json({ message: 'Card saved successfully', card: newCard });
  } catch (error) {
    return handleError(res, 'Add saved card', error);
  }
};

/**
 * DELETE /api/user/saved-cards/:cardId
 * Removes a saved card for the authenticated customer.
 * If the deleted card was the default, the first remaining card becomes default.
 */
export const deleteSavedCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const customer = await Customer.findOne({ where: { id: req.userID } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const existingCards = customer.savedCards || [];
    const cardToRemove = existingCards.find((c) => c.id === cardId);

    if (!cardToRemove) {
      return res.status(404).json({ message: 'Saved card not found' });
    }

    let updatedCards = existingCards.filter((c) => c.id !== cardId);

    // Promote first remaining card to default if the deleted card was default
    if (cardToRemove.isDefault && updatedCards.length > 0) {
      updatedCards[0] = { ...updatedCards[0], isDefault: true };
    }

    await customer.update({ savedCards: updatedCards });
    res.status(200).json({ message: 'Card removed successfully', cards: updatedCards });
  } catch (error) {
    return handleError(res, 'Delete saved card', error);
  }
};

/**
 * PATCH /api/user/saved-cards/:cardId/default
 * Sets a specific saved card as the default for the authenticated customer.
 */
export const setDefaultCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const customer = await Customer.findOne({ where: { id: req.userID } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const existingCards = customer.savedCards || [];

    if (!existingCards.some((c) => c.id === cardId)) {
      return res.status(404).json({ message: 'Saved card not found' });
    }

    const updatedCards = existingCards.map((c) => ({
      ...c,
      isDefault: c.id === cardId,
    }));

    await customer.update({ savedCards: updatedCards });
    res.status(200).json({ message: 'Default card updated', cards: updatedCards });
  } catch (error) {
    return handleError(res, 'Set default card', error);
  }
};
