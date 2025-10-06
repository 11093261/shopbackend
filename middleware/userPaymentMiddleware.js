const Userpayment = require("../models/userpayment")
const checkEligibilty = async(req,res,next)=>{
    try {
        const userId = req.user.userId
        const user = await Userpayment.findById(userId)
        if(!user.hasPaid){
            return res.status(403).json({message:'payment required before posting'})
        }
        if(user.postsCount >=20){
            return res.status(403).json({message:"Post limit reached ,please make another payment"})
        }
        next()
    } catch (error) {
        console.log(error)

        
    }
}
module.exports = checkEligibilty