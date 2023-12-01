const responseHandler = (res, config = {}) => {
    const { response, data, error, pagination } = { ...defaultConfig, ...config };
    if (error) console.error(error)
    return res.status(response[2] || defaultConfig.response[2]).json({
        responseCode: response[0],
        responseDescription: response[1],
        data,
        pagination
    })
}

// [responseCode, responseDescription, statusCode]
const responses = {
    success: ["00", "Success", 200],

    userExists: ["05", "User Already Exists"],
    userNotFound: ["10", "User Not Found"],
    invalidPassword: ["15", "Invalid password"],
    noMoreLeft: ["20", "No more left"],

    badRequest: ["400", "Bad request", 400],
    unauthorized: ["401", "Unauthorized", 401],
    notFound: ["404", "Not Found", 404],
    serverError: ["500", "Internal Server Error", 500],
}

const defaultConfig = {
    response: responses.success,
    data: undefined,
    error: undefined
}

module.exports = { responseHandler, responses }
