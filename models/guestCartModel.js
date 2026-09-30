import { Sequelize } from "sequelize";
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

// Carts for visitors who aren't logged in, keyed by the httpOnly sessionId
// cookie seeded in index.js. (Keying by IP address let everyone behind the
// same network share — and overwrite — one cart.)
const GuestCarts = db.define('guestcarts', {
  sessionId: {
    type: DataTypes.STRING(64),
    primaryKey: true
  },
  cartItems: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  freezeTableName: true
});

export default GuestCarts;
