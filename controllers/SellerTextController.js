const sellertext = require("../models/sellertext")
const mongoose = require("mongoose")
const getSellerText = async(req,res)=>{
    try {
        const foundText = await sellertext.find()
        if(!foundText){
            return res.status(401).json({message:"no text found"})
        }
        res.json(foundText)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error occured"
        })
        
    }
}

const sellerMessage = async(req,res)=>{
    try {
        const {sellerstext} = req.body
        if(!sellerstext){
            return res.status(401).json({message:"you have no message"})
        }
        const createdSellersText = new sellertext({
            textId:mongoose.Types.objectId,
            sellerstext

        })

        await createdSellersText.save()
        console.log(createdSellersText)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error occured"
        })
        
    }
}

module.exports = {
    getSellerText,
    sellerMessage

}