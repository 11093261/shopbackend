const orderPaymentSchema = require("../models/orderPayment")
const createpayments = async(req,res)=>{
    try {
        const {paymentMethod} = req.body
        if (!paymentMethod || !['paystack', 'cash-on-delivery', 'bank-transfer'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Valid payment method is required' });
        }
        const createdPayments = new orderPaymentSchema({
            userId:req.user._id,
            paymentMethod:paymentMethod
            


        })
        await createdPayments.save()
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error"
        })
        
    }
}
module.exports = {
    createpayments
}