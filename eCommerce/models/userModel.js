import { Sequelize } from 'sequelize';
import db from "../config/Database.js";

// Access the DataTypes object in Sequelize
const { DataTypes } = Sequelize;

// Define the users model
const Users = db.define('users', {
  username: {
    type: DataTypes.STRING,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    unique: true
  },
  refresh_token: {
    type: DataTypes.STRING,
    unique: true,
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
  freezeTableName:true
});

// Sync to the current database
(async () => {
  await db.sync();
})();

export default Users;