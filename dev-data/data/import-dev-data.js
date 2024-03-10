const fs = require('fs')
const mongoose = require('mongoose') 
const dotenv= require('dotenv')
const Tour = require('./../../Models/tourModel')
dotenv.config({path: './../../config.env'})  //we need env variables ofc 

//% Connecting to the database
const DB= process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) 

mongoose.connect(DB).then((res) =>{
    console.log("DB connection successful!")
})

//% Reading json file
const tours = fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8') //read the file and store it in a variable


//% FDunctions to import and delete data completely
const importData = async () => {
    try{
        await Tour.create(JSON.parse(tours)) //convert the json file into js object because create method can only take js object
        console.log("Data successfully loaded")
    }
    catch(err){
        console.log(err)
    }
    process.exit(); //tho its very harsh
}

const deleteData = async () => {
    try{
        await Tour.deleteMany() //delete all the data
        console.log("Data successfully deleted")
    }
    catch(err){
        console.log(err)
    }
    process.exit(); //tho its very harsh
}
console.log(process.argv) //this is an array of all the arguments passed in the command line (node -> locaiton of node) and ?(import-dev-data.js -> location of the file) and ?(import -> the argument passed)
// ===================
// '/snap/node/7823/bin/node',
// '/home/dvjsharma/Dev/Backend/Mongo/dev-data/data/import-dev-data.js',
// '--import'
// ===================
//Now if we specify a flag --import, then it will render the same flag into the console, so we will make the file such that it will import on import flag, and delted on delete flag
if(process.argv[2] === '--import'){
    importData()
}
else if(process.argv[2] === '--delete'){
    deleteData()
}