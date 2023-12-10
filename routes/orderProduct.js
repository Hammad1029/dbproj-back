var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/add", async (req, res) => {
    try {
        const { order_id, product_id } = req.body;
        await db.query(
            `call AddProductToOrder(${product_id},${order_id})`,
            { type: QueryTypes.RAW }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/delete", async (req, res) => {
    try {
        const { order_id, product_id } = req.body;
        await db.query(
            `call DeleteProductFromOrder(${product_id},${order_id})`,
            { type: QueryTypes.RAW }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/list", async (req, res) => {
    try {
        const { order_id } = req.body;
        const orderProducts = await db.query(
            `select op.order_id, op.product_id,count(op.order_id) as product_quantity, max(p.name) as product_name, max(p.quantity) as available  from "order_product" op 
            join "product" p on op.product_id = p.product_id where op.order_id = '${order_id}' group by op.order_id, op.product_id `,
            { type: QueryTypes.SELECT }
        )
        responseHandler(res, { data: orderProducts })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

module.exports = router;