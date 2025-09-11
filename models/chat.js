const mongoose = require("mongoose")
const chatSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,ref:"userAuth",
        
    },
    userpost:{
        type:String,
        required:true
    }
})
module.exports = mongoose.model("chatSchema",chatSchema)