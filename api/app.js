var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const securityMiddleware = require('./middlewares/securityMiddleware');
const { errorNotFound, errorHandler } = require('./middlewares/error');
require("dotenv").config();
const conectet = require('./config/conectet');


var authRouter = require('./routes/auth');
var profileRouter = require('./routes/profile');
const messageRouter = require('./routes/messageRoutes');
const AdminRouter = require("./routes/adminRoutes")
const categoryRouter = require('./routes/categoryRoutes');


var app = express();

conectet();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'auth-token'],
    exposedHeaders: ['auth-token']
  }));

const compression = require("compression")
app.use(compression())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(securityMiddleware);

app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/user', profileRouter);
app.use('/api/auth', authRouter);
app.use('/api/message', messageRouter);
app.use('/api/admin', AdminRouter)
app.use('/api/categories', categoryRouter);



// catch 404 and forward to error handler
app.use(errorNotFound);

// error handler
app.use(errorHandler);

module.exports = app;
