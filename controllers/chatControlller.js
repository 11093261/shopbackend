const mongoose = require("mongoose")
const chats = require("../models/chat")
const getAllChat = async(req,res)=>{
    try{
        const foundChat = await chats.find()
        if(!foundChat){
            return res.status(401).json({message:"no chat found"})
        }
        res.json(foundChat)
    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error occured"
        })

    }
}

const getAchat = async(req,res)=>{
    try{
        const {userId} = req.params
        const foundchat = await chats.findById(userId)
        if(!foundchat){
            return res.status(401).json({message:"no chat found"})
        }
        res.json(foundchat)

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error occured"
        })

    }

}

const createChat = async(req,res)=>{
    try{
        const {userpost} = req.body
        if(!userpost){
            return res.status(403).json({message:"this field is required"})
        }
        const createdChats = new chats({
            usereId:mongoose.Types.ObjectId,
            userpost:userpost
        })
        await createdChats.save()
        console.log(createdChats)

    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            messsage:"server error occured"
        })
    }
}

const updateChats = async(req,res)=>{
    try{
        const {userId} = req.params
        const {userpost} = req.body
        if(!userpost){
            return res.status(403).json({message:"field is required"})
        }
        const foundchat = await chats.findOneAndUpdate({
            userId,
            userpost,
            new:true
        })
        await foundchat.save() 
        console.log(foundchat) 
    }catch(error){
        console.log(error)
        res.status(500).json({
            success:false,
            message:"server error occured"
        })
    }
}
module.exports = {
    getAllChat,
    getAchat,
    createChat,
    updateChats
}