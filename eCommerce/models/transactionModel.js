import { Sequelize } from 'sequelize';
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const Transactions = db.define('transactions',{
  orderId: {
    type: DataTypes.INTEGER
  },
  customerId: { 
    type: DataTypes.INTEGER 
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.STRING
  },
  timestamp: {
    type: DataTypes.DATE
  },
  paymentMethod: {
    type: DataTypes.STRING
  },
  lastFour: {
    type: DataTypes.STRING
  },
  timeline: {
    type: DataTypes.JSON
  }
},{
  freezeTableName: true
});

(async () => {
  await db.sync();
})();

export default Transactions;