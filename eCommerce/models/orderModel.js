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
  }
}, {
  freezeTableName: true
});

(async () => {
  await db.sync();
})();

export default Orders;