// Points products at the local photos in client/public/images/products (TODO 2).
//   npm run fill-images            → only products with no image
//   npm run fill-images -- --all   → every product in the map (replaces imgur links too)
// Matches by product name using scripts/productImages.json. Works against whatever
// database .env points at (local SQLite or the real MySQL).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { initDatabase } from '../config/Database.js';
import Product from '../models/productModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRODUCT_IMAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'productImages.json'), 'utf8'));

const replaceAll = process.argv.includes('--all');

try {
  await initDatabase();
  let changed = 0;
  for (const product of await Product.findAll()) {
    const image = PRODUCT_IMAGES[product.name];
    if (!image) continue;
    if (product.product_img && !replaceAll) continue;
    if (product.product_img === image) continue;
    await product.update({ product_img: image });
    console.log(`  ${product.name} → ${image}`);
    changed += 1;
  }
  const unmatched = (await Product.findAll({ where: { product_img: '' } })).map((p) => p.name);
  console.log(`Updated ${changed} product(s).`);
  if (unmatched.length) console.log(`Still without an image: ${unmatched.join(', ')}`);
} finally {
  await db.close();
}
