const mongoose = require("mongoose")
const adminSchema = new mongoose.Schema(
  {
  // adminId:{
  //   type:mongoose.Types.ObjectId,ref:"Admin"

  // },
  username:{type:String,required:true,default:"admin"},
  password:{type:String,required:true},
  adminpost:{type:String,required:false}
  
},
{   
    
    timestamps:true,
    toJSON: { virtuals: true},
    toObject: { virtuals: true}
}

)

module.exports = mongoose.model("adminSchema",adminSchema)