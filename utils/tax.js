// State sales tax rates (as of 2024 — verify with your tax service before going live).
// Server-side so the charged total can't be changed from the browser; the checkout
// page shows whatever /api/checkout/quote returns.
export const STATE_TAX_RATES = {
  AL: 0.04,   AK: 0.0,    AZ: 0.056,  AR: 0.065,  CA: 0.0725,
  CO: 0.029,  CT: 0.0635, DE: 0.0,    FL: 0.06,   GA: 0.04,
  HI: 0.04,   ID: 0.06,   IL: 0.0625, IN: 0.07,   IA: 0.06,
  KS: 0.065,  KY: 0.06,   LA: 0.0445, ME: 0.055,  MD: 0.06,
  MA: 0.0625, MI: 0.06,   MN: 0.06875,MS: 0.07,   MO: 0.04225,
  MT: 0.0,    NE: 0.055,  NV: 0.0685, NH: 0.0,    NJ: 0.06625,
  NM: 0.05125,NY: 0.04,   NC: 0.0475, ND: 0.05,   OH: 0.0575,
  OK: 0.045,  OR: 0.0,    PA: 0.06,   RI: 0.07,   SC: 0.06,
  SD: 0.045,  TN: 0.07,   TX: 0.0625, UT: 0.0485, VT: 0.06,
  VA: 0.053,  WA: 0.065,  WV: 0.06,   WI: 0.05,   WY: 0.04,
  DC: 0.06,
};

export const normalizeState = (state) =>
  typeof state === 'string' ? state.trim().toUpperCase() : '';

export const isValidState = (state) =>
  Object.prototype.hasOwnProperty.call(STATE_TAX_RATES, normalizeState(state));

export const taxRateFor = (state) => STATE_TAX_RATES[normalizeState(state)] ?? 0;
