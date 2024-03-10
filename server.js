/*
    Server.js servers as entry point of the code, where app is imported and is made to listen to any activity on port 3000
    Further, all the database configurations happens here
*/
//% Importes and env packages
const mongoose = require('mongoose') // to connect mongo db to the app
const dotenv = require('dotenv') // to configure env variables
dotenv.config({ path: './config.env' }) //sets up the env variables present in config.env file note the app require needs to come later after this setting

const app = require('./app')

//% Database connection 
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) //replaces the password in the string with the actual password
mongoose.connect(DB).then((res) => { //error handeling left for later. you can aslo connect local db here
    // console.log(res.connection) //to get a bunch of info about the connection
    console.log("DB connection successful!")
})

// console.log(app.get('env')) //output -> development | Env variable set by express
// console.log(process.env)  //output-> { ..whole bunch of shit } | Env varibales by node


//% Server listening to imported app 
const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log("Server is up and burning! 🔥")
})

process.on('unhandledRejection', err => {
    console.log(err.name, '::', err.message)
    console.log("Shutting Down...")
    server.close(() => {
        process.exit(1)
    })
})
process.on('uncaughtException', err => {
    console.log(err.name, '::', err.message)
    console.log("Shutting Down...")
    process.exit(1)
})

//*============================  Notes  ==================================

//? Test code to inject data into dbms
// //creating instances out of the model
// const testTour = new Tour({
//     name: "The forest hiker",
//     rating: 4.7,
//     price: 497
// })
// testTour.save().then(doc => console.log(doc)).catch(err => console.log(err)) //just do save, it will give a promise then handel it, done using then