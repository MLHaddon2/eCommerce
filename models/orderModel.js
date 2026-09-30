import { Sequelize } from 'sequelize';
import db from "../config/Database.js";

const { DataTypes } = Sequelize;
const Orders = db.define('orders', {
  customerId: {
    type: DataTypes.INTEGER
  },
  orderDate: {
    type: DataTypes.DATE
  },
  orderItems: {
    type: DataTypes.JSON 
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  shippingAddress: {
    type: DataTypes.STRING
  },
  paymentMethod: {
    type: DataTypes.STRING
  },
  orderStatus: {
    type: DataTypes.STRING
  },
  // Where the receipt and shipping updates go (guests have no customer row).
  customerEmail: {
    type: DataTypes.STRING
  },
  trackingCarrier: {
    type: DataTypes.STRING
  },
  trackingNumber: {
    type: DataTypes.STRING
  },
  // [{ status, date, note? }] — every status change, oldest first.
  statusHistory: {
    type: DataTypes.JSON
  }
}, {
  freezeTableName: true
});

export default Orders;