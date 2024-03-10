/*
    File contains all the controllers for the user routes exported 
 */
const User = require('./../Models/userModel');
const catchAsync = require('./../Utils/catchAsync'); 
const fs = require('fs');
const AppError = require('./../Utils/appError');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getAllUsers = catchAsync(async(req, res) => {
    const userSchema = await User.find();

    res.status(200).json({
        status: 'success',//Jsend sepcification
        results: userSchema.length,
        data: {
            tours: userSchema
        }
    })
})

exports.updateMe = catchAsync(async(req, res, next) => {
    //1) create error if user posts password data
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400))
    }

    //2) update user document
    const filteredBody = filterObj(req.body, 'name', 'email') //we can also add role here but we dont want user to change their role so we use filet body to contain name and email only
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true}) //not dealing with datas afterall so findbyid an update

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async(req, res, next) => {  
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.getUser = (req, res) => {
    res.status(500).json({ //internal server error
        status: "error",
        message: "route not yet defined"
    })
}
exports.createUser = (req, res) => {
    res.status(500).json({ //internal server error
        status: "error",
        message: "route not yet defined"
    })
}
exports.updateUser = (req, res) => {
    res.status(500).json({ //internal server error
        status: "error",
        message: "route not yet defined"
    })
}
exports.deleteUser = (req, res) => {
    res.status(500).json({ //internal server error
        status: "error",
        message: "route not yet defined"
    })
}