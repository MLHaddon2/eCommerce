import { Sequelize } from "sequelize";

const db = new Sequelize('my_db', 'root', 'root', {
    host: "127.0.0.1",
    dialect: 'mysql'
});

try {
    db.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}
 
export default db;