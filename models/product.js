const mongoose = require("mongoose");
const userAuth = require("./userAuth");

const product = new mongoose.Schema({
    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userAuth',
     // Causing the error
  },
  sellername: {type:String,required:true},
  description:{type:String,required:true},
  phonenumber:{type:Number,required:true},
  price: {type:Number,required:true},
  imageUrl: String,
  quantity:{type:String,required:true},
  location:{type:String,required:true},
  name:String,
  createdAt: {
    type: Date,
    default: Date.now
  },
   businessName:String,
    postRemainng:{type:Number,default:0},
    postUsed:{type:Number,default:0},
    lastPayment:Date,
    paymentHistory:[{
      date:Date,
      amount:Number,
      reference:String,
      postPurchased:Number
    }],
  updatedAt:{type:Date,default:Date.now}
});

module.exports = mongoose.model("product", product);

