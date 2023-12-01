var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/create", async (req, res) => {
    try {
        const { description } = req.body;
        const { user_id } = req.user;
        await db.query(
            `insert into "Order" (user_id, description) values(${user_id},'${description}')`,
            { type: QueryTypes.INSERT }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/addProduct", async (req, res) => {
    try {
        const { order_id, product_id } = req.body;
        let quantity = await db.query(
            `select p.quantity from "product" p where p.product_id = '${product_id}'`,
            { type: QueryTypes.SELECT }
        )
        quantity = quantity[0].quantity;
        if (quantity <= 0) return responseHandler(res, { response: responses.noMoreLeft })
        await db.query(
            `insert into "order_product" (order_id,product_id) values('${order_id}', '${product_id}')`
            , { type: QueryTypes.INSERT })
        await db.query(
            `update "product" set quantity='${quantity - 1}' where product_id='${product_id}'`
            , { type: QueryTypes.UPDATE })
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/deleteProduct", async (req, res) => {
    try {
        const { order_id, product_id } = req.body;
        let quantity = await db.query(
            `select p.quantity from "product" p where p.product_id = '${product_id}'`,
            { type: QueryTypes.SELECT }
        )
        quantity = quantity[0].quantity;
        await db.query(
            `delete from "order_product" where order_id = '${order_id}' and product_id = '${product_id}'`,
            { type: QueryTypes.DELETE })
        await db.query(
            `update "product" set quantity='${quantity - 1}' where product_id='${product_id}'`
            , { type: QueryTypes.UPDATE })
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})


router.post("/update", async (req, res) => {
    try {
        const { order_id, description, } = req.body;
        const order = await db.query(
            `update "Order" set description = '${description}' where order_id='${order_id}'`,
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
            `delete from "Order" where order_id = '${order_id}'`,
            { type: QueryTypes.DELETE }
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
            `select * from "Order" where description ilike '%${keyword}%'`,
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