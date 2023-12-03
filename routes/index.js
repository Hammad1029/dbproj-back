const express = require('express');
const router = express.Router();

const authRouter = require("./auth");
const productRouter = require("./products");
const supplierRouter = require("./suppliers");
const ordersRouter = require("./orders");
const orderProductRouter = require("./orderProduct");

router.use("/auth", authRouter);
router.use("/product", productRouter);
router.use("/suppliers", supplierRouter);
router.use("/orders", ordersRouter);
router.use("/orderProduct", orderProductRouter);

module.exports = router;