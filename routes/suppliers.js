var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');

router.post("/create", async (req, res) => {
    try {
        const { name, contact } = req.body;
        await db.query(
            `insert into Supplier (name, contact) values('${name}', '${contact}')`,
            { type: QueryTypes.INSERT }
        )
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/update", async (req, res) => {
    try {
        const { name, contact, supplier_id } = req.body;
        const supplier = await db.query(
            `update Supplier set name = '${name}', contact = '${contact}' where supplier_id = '${supplier_id}'`,
            { type: QueryTypes.UPDATE }
        )
        if (supplier[1] === 0) return responseHandler(res, { response: responses.notFound })
        responseHandler(res)
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

router.post("/delete", async (req, res) => {
    try {
        const { supplier_id } = req.body;
        await db.query(
            `delete from Supplier where supplier_id = '${supplier_id}'`,
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
        const supplier = await db.query(`select * from Supplier where name ilike '%${keyword}%' or contact ilike '%${keyword}%'`,
            { type: QueryTypes.SELECT }
        )
        responseHandler(res, { data: supplier })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

module.exports = router;
