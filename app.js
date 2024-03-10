/*
    This app.js files servers as the main file for all the routes and middlewares. Everything related to source code middlewares and those being used as sub applicaitons are configured here
    Further, all the routes are defined here
 */

//% importing modules
const express = require("express");
const morgan = require('morgan'); //3rd party middleware for showing logs of what is requested, dev is just a format which is passed further
const rateLimit = require('express-rate-limit'); //3rd party middleware for limiting the number of requests from a single IP address
const helmet = require('helmet'); //3rd party middleware for setting security HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); //3rd party middleware for sanitizing the data against NoSQL query injection
const xss = require('xss-clean'); //3rd party middleware for sanitizing the data against XSS
const hpp = require('hpp'); //3rd party middleware for preventing parameter pollution
const app = express();

//% ERR importing error class
const AppError = require('./Utils/appError')
const globalErrorHandler = require('./Controllers/errorController')

//% importing sub application routers
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');

//% middlewares
app.use(helmet()); //this middleware is used to set security HTTP headers
if (process.env.NODE_ENV === "development") { //this is available globally hence you can use it inside any file
    app.use(morgan('dev'));
}
const limiter = rateLimit({ //this middleware is used to limit the number of requests from a single IP address
    max: 100, //max number of requests
    windowMs: 60 * 60 * 1000, //time in milliseconds (1hours)
    message: 'Too many requests from this IP, please try again in an hour'
})
app.use('/api', limiter); //this middleware is used to limit the number of requests from a single IP address
app.use(express.json({limit: '10kb'})); //when a client sends data through json payloads, this middleware parses the data and stores it in the body property of the request object as req.body. If this is not used, req.body will be undefined
app.use(mongoSanitize()); //this middleware is used to sanitize the data against NoSQL query injection
app.use(xss()); //this middleware is used to sanitize the data against XSS
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
})) //this middleware is used to prevent parameter pollution
app.use(express.static(`${__dirname}/dev-data`)) //this middleware is used to serve static files. __dirname is the current directory name and dev-data is the folder name which is being served
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString(); //adding requestTime property to the req object
    next();
})

//% Loading routers to their specific routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//% ERR catching unhandeled routes
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: "fail",
    //     message: `Can't find the ${req.originalUrl} on this server`
    // })

    // const err = new Error(`Can't find the ${req.originalUrl} on this server`)
    // err.status='fail'
    // err.statusCode=404

    const err = new AppError(`Can't find the ${req.originalUrl} on this server`, 404)
    next(err);
})

//% ERR handler middleware
app.use(globalErrorHandler)

module.exports = app; //exporting app to server.js which is entry point for the whole application