import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
dotenv.config();

// Tests (npm test) run against a throwaway in-memory SQLite database instead of MySQL.
// DB_DIALECT=sqlite (with DB_STORAGE=<file>) runs a local test copy with no MySQL server.
const db = process.env.NODE_ENV === 'test'
  ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
  : process.env.DB_DIALECT === 'sqlite'
  ? new Sequelize({ dialect: 'sqlite', storage: process.env.DB_STORAGE || './data/local.sqlite', logging: false })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
      }
    );

// Adds columns that were introduced after a table already existed.
// db.sync() only creates missing tables — it never alters existing ones.
const addMissingColumns = async () => {
  const qi = db.getQueryInterface();
  const userColumns = await qi.describeTable('users');

  if (!userColumns.isAdmin) {
    await qi.addColumn('users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    // One-time migration: admin used to be "whoever is named Admin".
    // Carry that account over so the admin panel keeps working.
    await db.query("UPDATE users SET isAdmin = true WHERE username = 'Admin'");
    console.log("Added users.isAdmin column (existing 'Admin' user promoted).");
  }

  // Plain nullable columns added after release: [table, column, type]
  const newColumns = [
    ['transactions', 'processorPaymentId', Sequelize.STRING],
    ['orders', 'customerEmail', Sequelize.STRING],
    ['orders', 'trackingCarrier', Sequelize.STRING],
    ['orders', 'trackingNumber', Sequelize.STRING],
    ['orders', 'statusHistory', Sequelize.JSON],
  ];
  const described = {};
  for (const [table, column, type] of newColumns) {
    described[table] = described[table] || await qi.describeTable(table);
    if (!described[table][column]) {
      await qi.addColumn(table, column, { type, allowNull: true });
      console.log(`Added ${table}.${column} column.`);
    }
  }
};

// Older sample reviews have no id, so they couldn't be edited or deleted.
// Gives each one a permanent id. No-op once every review has one.
const backfillReviewIds = async () => {
  const Product = db.models.products;
  if (!Product) return;
  let updated = 0;
  for (const product of await Product.findAll({ attributes: ['id', 'reviews'] })) {
    let reviews = product.reviews;
    if (typeof reviews === 'string') {
      try { reviews = JSON.parse(reviews); } catch { continue; }
    }
    if (!Array.isArray(reviews) || reviews.every((r) => r && r.id)) continue;
    await product.update({ reviews: reviews.map((r) => (r && !r.id ? { ...r, id: randomUUID() } : r)) });
    updated += 1;
  }
  if (updated) console.log(`Gave ids to legacy reviews on ${updated} product(s).`);
};

// Call once at startup, after all models have been imported.
export const initDatabase = async () => {
  await db.authenticate();
  await db.sync();
  await addMissingColumns();
  await backfillReviewIds();
  console.log('Database connection established and models synced.');
};

export default db;
