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
            contact VARCHAR(255),
            CONSTRAINT contactLengthChk CHECK (char_length(contact) = 11),
            CONSTRAINT contactTypeChk CHECK(contact ~ '^[0-9]*$')
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
                name varchar(255) not null,
                contact VARCHAR(255) not null,
                CONSTRAINT contactLengthChk CHECK (char_length(contact) = 11),
                CONSTRAINT contactTypeChk CHECK(contact ~ '^[0-9]*$'),
                shipping_address varchar(255) not null,
                order_date timestamp not null,
                description VARCHAR(255),
                total_value DECIMAL(10,2) default 0
            );
        `)
        console.log("Order table created/verified");

        await db.query(`
        CREATE TABLE IF NOT EXISTS order_log (
            log_id SERIAL PRIMARY KEY,
            order_id int not null,
            name varchar(255) not null,
            contact VARCHAR(255) not null,
            CONSTRAINT contactLengthChk CHECK (char_length(contact) = 11),
            CONSTRAINT contactTypeChk CHECK(contact ~ '^[0-9]*$'),
            shipping_address varchar(255) not null,
            order_date timestamp not null,
            description VARCHAR(255),
            total_value DECIMAL(10,2) default 0,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `)
        console.log("order_log table created/verified");

        await db.query(`
            CREATE TABLE IF NOT EXISTS "order_product" (
                id serial Primary Key,
                order_id INTEGER REFERENCES "Order" (order_id),
                product_id INTEGER REFERENCES "product" (product_id)
            );
        `)
        console.log("order_product table created/verified");

        await db.query(`
            CREATE OR REPLACE FUNCTION calculateOrderTotalValue() 
            RETURNS TRIGGER AS $$
            DECLARE
                orderTotal DECIMAL(10, 2);
            BEGIN
                SELECT COALESCE(SUM(p.price), 0) INTO orderTotal
                FROM product p
                JOIN order_product op ON p.product_id = op.product_id
                WHERE op.order_id = NEW.order_id;
            
                IF TG_OP = 'INSERT' THEN
                -- Calculate total value for the order after insert
                SELECT COALESCE(SUM(p.price), 0)
                INTO orderTotal
                FROM product p
                JOIN order_product op ON p.product_id = op.product_id
                WHERE op.order_id = NEW.order_id;
        
                UPDATE "Order"
                SET total_value = orderTotal
                WHERE order_id = NEW.order_id;
                
                RETURN NEW;
                
            ELSIF TG_OP = 'DELETE' THEN
                SELECT COALESCE(SUM(p.price), 0)
                INTO orderTotal
                FROM product p
                JOIN order_product op ON p.product_id = op.product_id
                WHERE op.order_id = OLD.order_id;
        
                UPDATE "Order"
                SET total_value = orderTotal
                WHERE order_id = OLD.order_id;
        
                RETURN OLD;
            END IF;
            
            RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log("calculateOrderTotalValue function created/verified");

        await db.query(`
            CREATE OR REPLACE TRIGGER updateOrderTotalValue
            AFTER INSERT OR DELETE ON order_product
            FOR EACH ROW
            EXECUTE FUNCTION calculateOrderTotalValue();
        `)
        console.log("updateOrderTotalValue trigger created/verified");

        await db.query(`
            CREATE OR REPLACE PROCEDURE AddProductToOrder(productId INT, orderId INT) 
            LANGUAGE 'plpgsql'
            AS $$
            DECLARE
                productQuantity INT;
            BEGIN
                SELECT quantity INTO productQuantity FROM product WHERE product_id = productId;
            
                IF productQuantity <= 0 THEN
                    RAISE EXCEPTION 'Product is out of stock or unavailable. Cannot add to the order.';
                ELSE
                    INSERT INTO order_product (order_id, product_id) VALUES (orderId, productId);
                    UPDATE product set quantity=productQuantity-1 where product_id = productId;
                END IF;
            END;
            $$;
        `)
        console.log("AddProductToOrder procedure created/verified");

        await db.query(`
            CREATE OR REPLACE PROCEDURE DeleteProductFromOrder(productId INT, orderId INT) 
            LANGUAGE 'plpgsql'
            AS $$
            DECLARE
                productQuantity INT;
            BEGIN
                SELECT quantity INTO productQuantity FROM product WHERE product_id = productId;
            
                delete from "order_product" where order_id =orderId and product_id =productId and id IN (
                    SELECT id FROM
                    order_product WHERE order_id = orderId and product_id = productId LIMIT 1
                );
                UPDATE product set quantity=productQuantity+1 where product_id = productId;
            END;
            $$;
        `)
        console.log("DeleteProductFromOrder procedure created/verified");

        await db.query(`
            CREATE OR REPLACE PROCEDURE logAndDeletOrderProcedure(
                p_order_id INTEGER
            )
            LANGUAGE plpgsql
            AS $$
            DECLARE
                order_name varchar(255);
                order_contact varchar(255);
                order_shipping_address varchar(255);
                order_order_date timestamp;
                order_description varchar(255);
                order_total_value decimal(10,2);
            BEGIN
                SELECT name, contact, shipping_address, order_date, description, total_value
                INTO order_name, order_contact, order_shipping_address, order_order_date, order_description, order_total_value
                FROM "Order" WHERE order_id = p_order_id;
            
                INSERT INTO order_log (order_id, name, contact, shipping_address, order_date, description, total_value)
                VALUES (p_order_id, order_name, order_contact, order_shipping_address, order_order_date, order_description, order_total_value);
            
                WITH OrderProductCounts AS (SELECT op.product_id, COUNT(op.product_id) AS product_count 
                FROM order_product op WHERE op.order_id = p_order_id GROUP BY op.product_id)
                UPDATE product p SET quantity = p.quantity + opc.product_count 
                FROM OrderProductCounts opc WHERE p.product_id = opc.product_id;
                
                DELETE FROM "order_product" WHERE order_id = p_order_id;
                Delete from "Order" where order_id = p_order_id;
            END;
            $$;
        `)
        console.log("logAndDeletOrderProcedure procedure created/verified");
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { configInit, db }