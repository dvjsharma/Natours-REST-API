const fs = require('fs');
const Tour = require('./../Models/tourModel')
const APIFeatures = require('./../Utils/APIFeatures') //importing the filering class

//% ERR importing catchAsync function and error class
const catchAsync = require('./../Utils/catchAsync')
const AppError = require('./../Utils/appError')

//? for accessing top 5 cheap tours
exports.aliasTopTours = (req, res, next) => {
    //! This is the exact business logic you always plan to apply in frontend
    req.query.limit = '5' //only 5 results to be displayed
    req.query.sort = '-ratingsAverage,price' //max rating, if same then min price
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty' //only these fields to be displayed
    next();
}

exports.getTours = catchAsync(async (req, res, next) => {

    // const queryObj = req.query //cant do this because it will be a reference to the original object, any change in the reference will change the original object
    // //%  1a.Filtering
    // const queryObj = { ...req.query }
    // const excludedFields = ['page', 'sort', 'limit', 'fields']
    // excludedFields.forEach(el => delete queryObj[el])
    // // console.log(req.query, queryObj) //you will see the difference 
    // //%  1b.Advanced filtering
    // let queryStr = JSON.stringify(queryObj)
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) //replacing the gte, gt, lte, lt with $gte, $gt, $lte, $lt

    // let query = Tour.find(JSON.parse(queryStr)) //qurey.prototype, not awaiting it yet

    //%  2.Sorting
    // if (req.query.sort) {
    //     const sortBy = req.query.sort.split(',').join(' ') //multiple sort
    //     query = query.sort(sortBy) //like price, and this is the prototype query.prototype.sort()
    // }
    // else {
    //     query = query.sort('-createdAt') //default sorting so newest ones appears first
    // }
    //%  3.Field limiting
    // if (req.query.fields) {
    //     const fields = req.query.fields.split(',').join(' ')
    //     query = query.select(fields) //('name duration price') //selecting only these fields
    // }
    // else {
    //     query = query.select('-__v') //excluding __v
    // }
    //%  4.Pagination
    // const page = req.query.page * 1 || 1 //converting string to number or defaulting it to 1
    // const limit = req.query.limit * 1 || 100 //converting string to number or defaulting it to 100
    // const skip = (page - 1) * limit //calculating the skip value
    // query = query.skip(skip).limit(limit)
    // if (req.query.page) {
    //     const numTours = await Tour.countDocuments() //counting the number of documents
    //     if (skip >= numTours) throw new Error('This page does not exist') //if the skip value is greater, this will directly make it jump ot catch block
    // }


    //% Execute query                //query obj  //query stirng
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()
    const tours = await features.query

    res.status(200).json({
        status: 'success',//Jsend sepcification
        results: tours.length,
        data: {
            tours: tours
        }
    })
})
exports.getParticulatTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findById(req.params.id) //here schema is important tho it is not used, somehow db object resides in the schema which needs to be accessed
    //Tour.findOne({_id: req.params.id}) //another way of doing the same thing
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404)) //err 
    }
    res.status(200).json({
        status: "success",
        data: {
            tour: tour
        }
    })

    // try {
    //    const tour = await Tour.findById(req.params.id) //here schema is important tho it is not used, somehow db object resides in the schema which needs to be accessed
    //Tour.findOne({_id: req.params.id}) //another way of doing the same thing
    // res.status(200).json({
    //     status: "success",
    //     data: {
    //         tour: tour
    //     }
    // })
    // }
    // catch (err) {
    //     res.status(400).json({
    //         status: "fail",
    //         message: err
    //     })
    // }
})
exports.AddNewTour = catchAsync(async (req, res, next) => {

    // const newTour = new Tour({})
    // newTour.save() //this was the earlier code, creating a model and saving it. Better is

    const newTour = await Tour.create(req.body); //creating the tour and saving it, handeling promise with async await

    res.status(201).json({ //201 for success
        status: 'success',
        data: {
            tours: newTour
        }
    })
})
exports.UpdateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true, //returns the new updated object, consider ducmentation (options obj as new param)
        runValidators: true //runs the schema validators again
    })
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404)) //err 
    }
    res.status(200).json({
        status: "success",
        data: {
            tour: tour
        }
    })

})
exports.DeleteTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndDelete(req.params.id)
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404)) //err 
    }
    res.status(204).json({ //when you send 204 status in response, postman dunno display anything

        status: "success",
        data: null
    })
})

exports.getTourStats = catchAsync(async (req, res, next) => { //this is an aggregation pipeline and groups by difficulty
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null,
                // _id: {$toUpper: '$ratingsAverage'}, 
                _id: '$difficulty', //grouping by difficulty, can be useful for insights and admin
                numTours: { $sum: 1 }, //1 will be added throught to new field numTours
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 } //use fieldname and 1 for ascending and -1 for descending (use names form above)
        }
        // {
        //     $match: {_id: {$ne: 'easy'}} //ne means not equal to and this is to show we can mattch multiple time 
        // }

    ])
    res.status(200).json({
        status: "success",
        data: stats
    })
})
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' //deconstructing the array
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' } //pushing the name of the tours in an array using push
            }
        },
        {
            $addFields: { month: '$_id' } //adding a new field
        },
        {
            $project: { _id: 0 } //0 means not showing the field
        },
        {
            $sort: { numTourStarts: -1 } //descending
        },
        {
            $limit: 12 //limiting to 12
        }
    ])
    res.status(200).json({
        status: "success",
        length: plan.length,
        data: plan
    })
})