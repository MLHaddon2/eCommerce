import { Sequelize } from "sequelize";
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const Customers = db.define('customers', {
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  cartItems: {
    type: DataTypes.JSON, // or TEXT if you're storing as JSON string
    allowNull: true,
    defaultValue: []
  },
  lastLogin: {
    type: DataTypes.STRING
  },
  ipHistory: {
    type: DataTypes.JSON
  },
  totalOrders: {
    type: DataTypes.INTEGER
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2)
  }
}, {
  freezeTableName: true
});

(async () => {
  await db.sync();
})();

export default Customers;