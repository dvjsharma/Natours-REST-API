const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const User = require('./../Models/userModel')
const catchAsync = require('./../Utils/catchAsync')
const AppError = require('./../Utils/appError')
const sendEmail = require('./../Utils/email')
const { send } = require('process')
const crypto = require('crypto')

const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), //converting to milliseconds - now + 90 days
    // secure: true, //this means cookie will only be sent on encrypted connection https
    httpOnly: true //this means cookie cannot be accessed or modified in any way by browser
}

exports.signup = catchAsync(async (req, res, next) => {

    // const newUser = await User.create(req.body) //this is bad casue anyone can add admin role to themselves 
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    }) //this is correct way of doing this
    User.password = undefined //this is done so that password is not sent to client
    //payload,  secret, options
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true //this means cookie will only be sent on encrypted connection https and this is only for production cause rn we are using http
    res.cookie('jwt', token, cookieOptions) //this is how we send cookie to client
    res.status(201).json({
        status: "success",
        token,
        data: {
            user: newUser
        }
    })
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    //1) check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400)) //imp to return
    }

    //2) check if user exists and password is correct
    const user = await User.findOne({ email: email }).select('+password') //select is set to false in the model so we need to add it here
    // const correct = await user.correctPassword(password, user.password) //this is an instance method in userModel.js
    if (!user || !await user.correctPassword(password, user.password)) { //could have done seperately, but that would tell attacker what is wrong email or password plus, this correct is not used cause user needs to exits for correct to exist
        return next(new AppError('Incorrect email or password', 401))
    }

    //3) if everything is ok, send token to client
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true //this means cookie will only be sent on encrypted connection https and this is only for production cause rn we are using http
    res.cookie('jwt', token, cookieOptions) //this is how we send cookie to client
    res.status(200).json({
        status: "success",
        token
    })
})

exports.protect = catchAsync(async (req, res, next) => {
    //1) Getting token and check if it exists
    //header is like authorization: Bearer skdjfhklhdahdlahd  (key: value)
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
        //return form middleware to error middleware
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }

    //2) Verification token - signed and not expired
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    //this promisify is a function that takes a function that takes a callback  return a promise and we can use await on it
    // console.log(decoded) //it gives id of user, issued at time, expiration time
    //if error, then handeled in global error handler (JsonWebTokenError, TokenExpiredError)

    //3) Check if user still exists- suppose someone steals token, then user changes pass, then token is still valid but user is not so we need to check if user still exists
    const freshUser = await User.findById(decoded.id)
    if (!freshUser) {
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    //4) Check if user changed password after the token was issued 
    // instance method in model
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again', 401))
    }

    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser //we can use this user in the next middleware so we injected it in the request
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => { //this is done to get access to roles, cause middleware only has access to req, res, next not any arguments we pass
        //roles is an array ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) { //we loaded this req.user in the protect middleware
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address', 404))
    }
    //2) Generate the random reset token (generated as instance method in model)
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false }) //we need to save this token to database but we dont need to validate it so we use this
    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}` //this is the url that will be sent to user
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!` //this is the message that will be sent to user

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false }) //above only modifies the data, this save actually saves it to database
        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex') //this is the token we get from the url and we hashed it. And we will compare this with that in db. 2 hashed tokens are same if they are created from same string cause we didnt use bcrypt its notmal hash using internal crypto module
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } }) //this is the user we get from the token 
    //2) If token has not expired and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined //we dont need these anymore
    user.passwordResetExpires = undefined
    await user.save() //we need to save it to database
    //3) Update changedPasswordAt property for the user
    //4) Log the user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true //this means cookie will only be sent on encrypted connection https and this is only for production cause rn we are using http
    res.cookie('jwt', token, cookieOptions) //this is how we send cookie to client
    res.status(200).json({
        status: "success",
        token
    })
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended! 2 reasons, in the model we have validator to check if the password and passwordConfirm are same, they wont work on update cause there will be no "this object" hence we need to save only. Secondly, the hashing pre middleware and timestamp pre middleware wont work because we are not using save method, they work on save only
    // 4) Log user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true //this means cookie will only be sent on encrypted connection https and this is only for production cause rn we are using http
    res.cookie('jwt', token, cookieOptions) //this is how we send cookie to client
    res.status(200).json({
        status: "success",
        token
    })
});