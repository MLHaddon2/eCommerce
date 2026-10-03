// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// react-router 7 needs TextEncoder/TextDecoder, which Jest's jsdom environment doesn't provide.
Object.assign(global, { TextEncoder, TextDecoder });

// jsdom has no matchMedia; react-bootstrap's Offcanvas (the header sidebar) calls it.
window.matchMedia = window.matchMedia || ((query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
}));
