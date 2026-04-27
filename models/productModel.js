import { Sequelize } from 'sequelize';
import db from '../config/Database.js';

// Access the Datatypes from sequelize
const { DataTypes } = Sequelize;

const Product = db.define('products', {
  name: {
    type: DataTypes.STRING,
  },
  summary: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  reviews: {
    type: DataTypes.JSON
  },
  availability: {
    type: DataTypes.INTEGER
  },
  price: {
    type: DataTypes.FLOAT
  },
  category: {
    type: DataTypes.JSON
  },
  product_img: {
    type: DataTypes.STRING
  }
}, {
  freezeTableName:true
});

// Sync to the current database
(async () => {
  await db.sync();
})();

export default Product;