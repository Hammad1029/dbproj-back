const express = require('express');
const router = express.Router();

const authRouter = require("./auth");
const productRouter = require("./products");
const supplierRouter = require("./suppliers");
const ordersRouter = require("./orders");

router.use("/auth", authRouter);
router.use("/product", productRouter);
router.use("/suppliers", supplierRouter);
router.use("/orders", ordersRouter);

module.exports = router;