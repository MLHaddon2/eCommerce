import { Sequelize } from 'sequelize';
import db from "../config/Database.js";

// Access the DataTypes object in Sequelize
const { DataTypes } = Sequelize;


// Define the users model
const Users = db.define('users', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
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