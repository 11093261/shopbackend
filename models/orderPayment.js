const mongoose = require("mongoose")
const orderPaymentSchema = new mongoose.Schema({
     userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              required: true
    },
    paymentMethod:{
      type: String,
      required: true,
      enum: ['paystack', 'cash-on-delivery', 'bank-transfer']
    },
    
})
module.exports = mongoose.model("orderPaymentSchema",orderPaymentSchema)