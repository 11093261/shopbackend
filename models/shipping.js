const mongoose = require("mongoose")
const shippingSchema = new mongoose.Schema({
    userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
    },
    shippingAddress:{
        fullName:String,
        street:String,
        city:String,
        state:String,
        zip:String,
        phone:String
    }
})
module.exports = mongoose.model("shippingSchema",shippingSchema)