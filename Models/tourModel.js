const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
//creating a mongoose schema
const toursSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tour must have a name"], //also specified the error it must display, for that pass an error
        unique: [true, "Name must be unique"], //cannot have two tours with same name
        trim: true, //removes all the white spaces in the beginning and end
        maxlength: [40, "A tour name must have less or equal than 40 characters"], //validator
        minLength: [10, "A tour name must have more or equal than 10 characters"], //validator
        // validate: [validator.isAlpha, "Tour name must only contain characters"] //validator using external library
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, "Tour must have a duration"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "Tour must have a group size"]
    },
    difficulty: {
        type: String,
        required: [true, "Tour must have a difficulty"],
        enum: { //validator
            //this notation is actually the shorthand of the above notation of [true, message]
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty is either: easy, medium, difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be above 1.0"], //validators
        max: [5, "Rating must be below 5.0"] //validators
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, "Tour must have a price"]
    },
    priceDiscount:{
        type: Number,
        validate: {
            validator: function(val){ //custom validator
                //this only points to current doc on new doc creation not update
                return val < this.price //this points to the current doc on new doc creation
            },
            message: "Discount price ({VALUE}) should be below regular price"
        }
    },
    summary: {
        type: String,
        trim: true, //removes all the white spaces in the beginning and end
        required: [true, "Tour must have a summary"]
    },
    description: {
        type: String,
        trim: true //removes all the white spaces in the beginning and end
    },
    imageCover: {
        type: String, //can also use complete image, but we generaly store the name of the image or instance and later read it form the file system
        required: [true, "Tour must have a cover image"]
    },
    images: [String], //array of strings of names of images
    secretTour:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date] //array of dates for the start dates of the tour in different part of years

},{ //need to pass this as a second object inside the param of the schema to include the virtual properties in the output
    toJSON: {virtuals:true}, 
    toObject: {virtuals:true} 
})
//creating a virtual property (not stored in db and is a derived property form what we have in db)
toursSchema.virtual('durationWeeks').get(function () { //not arrow because of this
    return this.duration / 7
})

//document middleware (mongo)
toursSchema.pre('save', function(next){ //called pre save hook and miiddleware can be used for the same hook multiple times
    //this func will be called before actual saving/creating of the document but not insertmany
    // console.log(this) //you will get this into console 
    // this.slug = slugify(this.name, {lower: true})
    next();
})
toursSchema.post('save', function(doc, next){ //have access to the doc saved to the db
    //dont have access to this, cause the doc is already saved and this func is executed after all the pre middleware

    next();
})

//query middleware (mongo)
toursSchema.pre(/^find/, function(next){ //all the strings that start with find
    // this.find({secretTour: {$ne: true}}) //this points to the current query
    // this.start=Date.now();
    next();
})
toursSchema.post(/^find/, function(docs, next){
    // console.log(docs)
    // console.log(`Query took ${Date.now()-this.start} milliseconds`)
    next();
})
//aggregation middleware (mongo)
toursSchema.pre('aggregate', function(next){ //this points to current aggregation object
    // console.log(this.pipeline())
    // this.pipeline().unshift({$match: {secretTour: {$ne: true}}}) //unshift adds the object at the beginning of the array
    next();
})

//creating a mongoose model
const Tour = mongoose.model('Tour', toursSchema) //T capital for model namnes | name of the model , schema

module.exports = Tour;