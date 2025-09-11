const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
    {
          cart: {
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      }
    }]
  },

   shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },

    role:{
      type:String,
      required:true,
      enum:['Admin', 'Editor', 'Viewer', 'User'],
      default:"User",


    },
    refreshToken:{
        type:String
    }
   

   
},


{   
    
    timestamps:true,
    toJSON: { virtuals: true},
    toObject: { virtuals: true}
}
)
module.exports = mongoose.model("User",userSchema)