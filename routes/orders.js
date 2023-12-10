var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/create", async (req, res) => {
    try {
        const { name, contact, shipping_address, description } = req.body;
        await db.query(
            `insert into "Order" (name, contact, shipping_address, order_date, description) 
            values('${name}','${contact}','${shipping_address}',to_timestamp(${Date.now()} / 1000.0),'${description}')`,
            { type: QueryTypes.INSERT }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/update", async (req, res) => {
    try {
        const { order_id, name, contact, shipping_address, description } = req.body;
        const order = await db.query(
            `UPDATE "Order"
            SET
              name = '${name}',
              contact = '${contact}',
              shipping_address = '${shipping_address}',
              description = '${description}'
            WHERE
              order_id = '${order_id}';`,
            { type: QueryTypes.UPDATE }
        )
        if (order[1] === 0) return responseHandler(res, { response: responses.notFound })
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/delete", async (req, res) => {
    try {
        const { order_id } = req.body;
        await db.query(
            `call logAndDeletOrderProcedure('${order_id}')`,
            { type: QueryTypes.RAW }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/list", async (req, res) => {
    try {
        const { keyword } = req.body;
        const orders = await db.query(
            `select * from "Order"
            WHERE 
              description ILIKE '%${keyword}%' 
              OR name ILIKE '%${keyword}%' 
              OR contact ILIKE '%${keyword}%' 
              OR shipping_address ILIKE '%${keyword}%';`,
            { type: QueryTypes.SELECT }
        )
        responseHandler(res, { data: orders })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.get("/getStats", async (req, res) => {
    try {
        const totalProducts = await db.query(`select count(*) from "product" p`, { type: QueryTypes.SELECT })
        const totalSuppliers = await db.query(`select count(*) from "supplier" s `, { type: QueryTypes.SELECT })
        const totalOrders = await db.query(`select count(*) from "Order" o`, { type: QueryTypes.SELECT })
        const totalRevenue = await db.query(
            `select sum(price) from "order_product" op join "product" p on op.product_id = p.product_id`
            , { type: QueryTypes.SELECT }
        )
        const categoryWise = await db.query(
            `select category, sum(p.price) from "order_product" op join "product" p on op.product_id = p.product_id group by category`
            , { type: QueryTypes.SELECT }
        )
        const supplierWise = await db.query(
            `select s.name as supplier_name, sum(p.price) from order_product op join product p on op.product_id = p.product_id join supplier s on p.supplier_id = s.supplier_id group by s.supplier_id `
            , { type: QueryTypes.SELECT }
        )
        responseHandler(res, {
            data: {
                totalProducts, totalSuppliers, totalOrders, totalRevenue, categoryWise, supplierWise
            }
        })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

module.exports = router;