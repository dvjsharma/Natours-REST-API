module.exports = (fn) =>{ //accepts the function itself as a parameter
    return (req, res, next) => { //returns a function which is the same as the function passed as a parameter 
        fn(req, res, next).catch(err => next(err)) //since the function passed as a parameter is an async function, it will return a promise. If the promise is rejected, it will be caught by the catch block and passed to the next middleware which is the global error handler
    }
}