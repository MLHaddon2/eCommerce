// Seeds a local database with the sample products and two test logins.
//   npm run seed
// Safe to re-run: it only adds products if there are none, and only creates the
// test users if they don't exist. To start over, delete data/local.sqlite first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import db, { initDatabase } from '../config/Database.js';
import Product from '../models/productModel.js';
import Users from '../models/userModel.js';
import Customers from '../models/customerModel.js';
import '../models/orderModel.js';
import '../models/transactionModel.js';
import '../models/ipHistoryModel.js';
import '../models/guestCartModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Local photos for products whose sample data has no image (see scripts/fillProductImages.js).
const PRODUCT_IMAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'productImages.json'), 'utf8'));

const TEST_USERS = [
  { username: 'admin', password: 'admin12345', email: 'admin@example.test', isAdmin: true,
    firstName: 'Admin', lastName: 'User' },
  { username: 'tester', password: 'tester12345', email: 'tester@example.test', isAdmin: false,
    firstName: 'Test', lastName: 'Customer', address: '1 Test St, Portland, OR 97201' },
];

const parseJson = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const seedProducts = async () => {
  if (await Product.count() > 0) {
    console.log('Products already present — skipping.');
    return;
  }

  const file = path.join(__dirname, '../client/src/views/Assets/shoesFinal.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));

  const products = raw.map((p) => ({
    name: p.name,
    summary: p.summary,
    description: p.description,
    price: Number(p.price),
    category: parseJson(p.category, []),
    reviews: parseJson(p.reviews, []),
    // Several samples are listed as out of stock; give them stock so every item can be bought in testing.
    availability: Number(p.availability) > 0 ? Number(p.availability) : 10,
    product_img: p.product_img || PRODUCT_IMAGES[p.name] || '',
    isDonation: false,
  }));

  products.push({
    name: 'Community Shoe Drive Donation',
    summary: 'Help put shoes on kids who need them',
    description: 'Every donation buys a new pair of shoes for a child in our local community shoe drive.',
    price: 25,
    category: ['Donation'],
    reviews: [],
    availability: 0,
    product_img: '',
    isDonation: true,
  });

  await Product.bulkCreate(products);
  console.log(`Added ${products.length} products (including 1 donation item).`);
};

const seedUsers = async () => {
  for (const u of TEST_USERS) {
    const existing = await Users.findOne({ where: { username: u.username } });
    if (existing) {
      console.log(`User "${u.username}" already exists — skipping.`);
      continue;
    }
    await Users.create({
      username: u.username,
      email: u.email,
      password: await bcrypt.hash(u.password, 10),
      isAdmin: u.isAdmin,
      lastLogin: new Date(),
    });
    if (!u.isAdmin) {
      await Customers.create({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        address: u.address || '',
        cartItems: [],
        ipHistory: [],
        savedCards: [],
        totalOrders: 0,
        totalSpent: 0,
      });
    }
    console.log(`Created ${u.isAdmin ? 'admin' : 'customer'} login: ${u.username} / ${u.password}`);
  }
};

try {
  if (process.env.DB_DIALECT === 'sqlite') {
    fs.mkdirSync(path.dirname(path.resolve(process.env.DB_STORAGE || './data/local.sqlite')), { recursive: true });
  }
  await initDatabase();
  await seedProducts();
  await seedUsers();
} finally {
  await db.close();
}
