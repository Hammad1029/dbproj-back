const jwt = require("jsonwebtoken");
const { responseHandler, responses } = require("../utils/responseHandler");



exports.validator = async (req, res, next) => {
    try {
        // const token = req.headers.authorization;
        // if (token)
        //     req.user = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET)
        next();
    } catch (e) {
        console.error(e)
        return responseHandler(res, { response: responses.unauthorized })
    }
}