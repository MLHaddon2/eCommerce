import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import axios from './api/axios';

// Smoke tests: the app renders its pages without a server. Every API call goes
// through api/axios.js, so that one module is replaced with canned responses.
jest.mock('./api/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  setAuthToken: jest.fn(),
}));

const PRODUCT = {
  id: 1, name: 'Classic Penny Loafer', summary: 'Timeless leather loafer', description: 'A shoe.',
  price: 159.9, availability: 5, category: ['Loafers'], reviews: [], product_img: '', isDonation: false,
};

const RESPONSES = {
  '/api/session': { user: null },
  '/api/cart': { cartItems: [] },
  '/api/products/getallhistory': [PRODUCT, { ...PRODUCT, id: 2, name: 'Sold Out Sandal', availability: 0 }],
};

beforeEach(() => {
  axios.get.mockImplementation((url) =>
    url in RESPONSES
      ? Promise.resolve({ status: 200, data: RESPONSES[url] })
      : Promise.reject(Object.assign(new Error(`Unexpected GET ${url}`), { response: { status: 404, data: {} } }))
  );
});

const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

test('home page lists products with two-decimal prices and marks sold-out ones', async () => {
  renderAt('/');
  expect(await screen.findByText('Classic Penny Loafer')).toBeInTheDocument();
  expect(screen.getAllByText('$159.90')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Out of Stock' })).toBeDisabled();
});

test('unknown URLs show the not-found page instead of a blank screen', async () => {
  renderAt('/no-such-page');
  expect(await screen.findByText('Page not found')).toBeInTheDocument();
});

test('a product that does not exist says so instead of loading forever', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {}); // the 404 is logged on purpose
  renderAt('/product/999');
  expect(await screen.findByText('Product not found')).toBeInTheDocument();
  console.error.mockRestore();
});
