const { Sequelize } = require('sequelize');
const dotenv = require("dotenv");

dotenv.config()

const { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
const db = new Sequelize(`postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`, { logging: false });

const configInit = async () => {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
        await db.query(`
            CREATE TABLE IF NOT EXISTS "User" (
                user_id SERIAL PRIMARY KEY,
                role VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `)
        console.log("Users table created/verified");
        await db.query(`
        CREATE TABLE IF NOT EXISTS Supplier (
            supplier_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL unique,
            contact VARCHAR(255)
        );
        `)
        console.log("Supplier table created/verified");
        await db.query(`
            CREATE TABLE IF NOT EXISTS Product (
                product_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                category VARCHAR(255),
                quantity INTEGER NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                supplier_id INTEGER REFERENCES Supplier(supplier_id)
            );
        `)
        console.log("Product table created/verified");
        await db.query(`
            CREATE TABLE IF NOT EXISTS "Order" (
                order_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES "User"(user_id),
                description VARCHAR(255)
            );
        `)
        console.log("Order table created/verified");
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_product (
                id unique not null primary key,
                order_id INTEGER REFERENCES "Order"(order_id)\,
                product_id INTEGER REFERENCES Product(product_id)\,
            );
        `)
        console.log("order_product table created/verified");
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { configInit, db }