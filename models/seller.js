const mongoose = require("mongoose")
const seller = new mongoose.Schema(
  {
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'userAuth',
  required: true // Causing the error
},
    sellername:{type:String,required:true},
    price:{type:Number,required:true},
    phonenumber:{type:Number,required:true},
    description:{String,required:true},
    quantity:{type:Number,required:true},
    imageUrl:String,
    location:{String,required:true},
   

  
    
    
}

)

module.exports = mongoose.model("seller",seller)

