import { Sequelize } from "sequelize";
import db from '../config/Database.js';

const { DataTypes } = Sequelize;

const IpHistories = db.define('iphistories', {
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false
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