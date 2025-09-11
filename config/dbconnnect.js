const mongoose = require("mongoose")
const Admin = require("../models/admin")

require("dotenv").config()
const dbconnect = async()=>{
    try {
        await mongoose.connect(process.env.DATABASE_URL)
       
    } catch (error) {
        console.log(error)
        
    }
}
module.exports = dbconnect