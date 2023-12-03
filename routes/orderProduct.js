var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/add", async (req, res) => {
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

router.post("/delete", async (req, res) => {
    try {
        const { order_id, product_id } = req.body;
        let quantity = await db.query(
            `select p.quantity from "product" p where p.product_id = '${product_id}'`,
            { type: QueryTypes.SELECT }
        )
        quantity = quantity[0].quantity;
        await db.query(
            `delete from "order_product" where order_id = '${order_id}' and product_id = '${product_id}' and id IN (
                SELECT id FROM
                order_product WHERE order_id = '${order_id}' and product_id = '${product_id}' LIMIT 1
             )`,
            { type: QueryTypes.DELETE })
        await db.query(
            `update "product" set quantity='${quantity + 1}' where product_id='${product_id}'`
            , { type: QueryTypes.UPDATE })
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