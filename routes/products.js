var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/create", async (req, res) => {
    try {
        const { name, description, category, quantity, price, supplier_id } = req.body;
        await db.query(
            `insert into Product (name, description, category, quantity, price, supplier_id) values('${name}','${description}','${category}','${quantity}','${price}', '${supplier_id}')`,
            { type: QueryTypes.INSERT }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/update", async (req, res) => {
    try {
        const { product_id, name, description, category, quantity, price, supplier_id } = req.body;
        const product = await db.query(
            `update Product set name = '${name}', description = '${description}', category = '${category}', quantity = '${quantity}',price = '${price}', supplier_id = '${supplier_id}' where product_id = '${product_id}'`,
            { type: QueryTypes.UPDATE }
        )
        if (product[1] === 0) return responseHandler(res, { response: responses.notFound })
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/delete", async (req, res) => {
    try {
        const { product_id } = req.body;
        await db.query(
            `delete from Product where product_id = '${product_id}'`,
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
        const product = await db.query(
            `select * from Product where name ilike '%${keyword}%' or description ilike '%${keyword}%' or category ilike '%${keyword}%' or cast(quantity as varchar) ilike '%${keyword}%' or  cast(price as varchar) ilike '%${keyword}%' or cast(supplier_id as varchar) ilike '%${keyword}%'`,
            { type: QueryTypes.SELECT }
        )
        responseHandler(res, { data: product })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

module.exports = router;
