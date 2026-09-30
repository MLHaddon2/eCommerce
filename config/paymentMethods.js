// Which payment methods checkout offers, by shipping state (TODO 4).
//
// To stop offering a method in a state, add the state code to its excludedStates,
// e.g. excludedStates: ['HI', 'AK']. The checkout quote only lists allowed methods,
// and the payment endpoints refuse a method that isn't allowed for the order's state.
//
// When Klarna / Afterpay are added (TODO 3), add them here with their own exclusions —
// both have state-by-state lending rules, so check their current merchant docs.
export const PAYMENT_METHODS = {
  square: { label: 'Card (Square)', excludedStates: [] },
  paypal: { label: 'PayPal', excludedStates: [] },
};

// Donation-only orders have no shipping state; every method is offered.
export const paymentMethodsFor = (state) =>
  Object.entries(PAYMENT_METHODS)
    .filter(([, method]) => !state || !method.excludedStates.includes(state))
    .map(([id, method]) => ({ id, label: method.label }));

export const isPaymentMethodAllowed = (id, state) =>
  paymentMethodsFor(state).some((method) => method.id === id);
