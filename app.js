var createError = require('http-errors');
var express = require('express');
var cors = require('cors')
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require("express-fileupload");
const {validator} = require("./utils/validator")
const router = require('./routes/index');
const { configInit } = require('./config');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
app.use(cors())

app.use(validator);
app.use('/', router);

app.use(function (req, res, next) {
  next(createError(404));
});

configInit();

const PORT = 5600;
const server = app.listen(PORT, console.log(`Server running port ${PORT}`));

module.exports = { app, server };
