var express = require("express");
const { db } = require("../config");
const { responseHandler, responses } = require("../utils/responseHandler");
var router = express.Router();
const { QueryTypes } = require('sequelize');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body
        let user = await db.query(`select * from "User" u where u.username = '${username}'`, { type: QueryTypes.SELECT })
        if (user.length === 0) return responseHandler(res, { response: responses.userNotFound })
        user = user[0]
        // const passwordCheck = await bcrypt.compare(password, user.password);
        const passwordCheck = password === user.password;
        if (!passwordCheck) return responseHandler(res, { response: responses.invalidPassword })
        const token = jwt.sign({ user_id: user.user_id, createdAt: new Date(), admin: user.role }, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY });
        responseHandler(res, {
            data: { userDetails: { ...user, password: undefined, jwt: undefined }, token }
        })
    } catch (error) {
        responseHandler(res, { response: responses.serverError, error })
    }
})

module.exports = router;
