const mongoose = require("mongoose")
const sellertextSchaema = new mongoose.Schema({
    textId:{
        type:mongoose.Types.ObjectId,
        ref:"Seller"
    },

    sellerstext:{
        type:String,
        required:true

    }
})
module.exports = mongoose.model("sellertextSchema",sellertextSchaema)