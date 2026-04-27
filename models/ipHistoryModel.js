import { Sequelize } from "sequelize";
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const IpHistories = db.define('iphistories', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0000' // Default to '0000' for guest users
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cartItems: {
        type: DataTypes.JSON, // or TEXT if you're storing as JSON string
        allowNull: true,
        defaultValue: []
    }
}, {
    freezeTableName: true
});

(async() => {
    await db.sync();
})();

export default IpHistories;