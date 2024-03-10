class AppError extends Error{
    constructor(message, statusCode){
        super(message); //because in built Error only accepts message
        this.statusCode=statusCode; //status code like 404
        this.status=`${statusCode}`.startsWith('4')? 'Fail' : 'Internal Server Error'; //maaging status form code
        this.isOperational=true; //if any other package or code err occour, it wont have this prop as true
        Error.captureStackTrace(this, this.constructor); //to have the error call stack with us
    }
}

module.exports = AppError;