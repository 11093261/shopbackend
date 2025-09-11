const redis = require("redis")
require("dotenv").config()
const userAuth = require("../models/userAuth")
const jwt = require("jsonwebtoken")
const client = redis.createClient({
    host:"localhost",
    port:3200
})

 
const Login = async(req,res)=>{
    const{email, password}=req.body
    if(!email || !password){
        return res.status(400).json({message:"all fields are required"})
    }
    const finduser = await userAuth.findById(req.param.id)
    if(!finduser){
        return res.status(400).json({message:"credientals are not recognized"})

    }
    const accessToken = process.env.ACCESS_TOKEN_SECRET
    const match = await bcrypt.compare(password,finduser.password)
    if(match){
        const Token = jwt.sign({ userid:user._id},accessToken)
        client.set(`token${user._id}`,Token)
        
    }
    const verify = req.header('Authorization')
    if(!verify) return res.status(409).json({message:"unauthorized"})
        client.get(`token:${req.user._id}`,(err,storedToken)=>{
            if(err || storedToken !== Token){
                return res.status(401).json({message:"invalid token"})
            } 
    })
}

module.exports = Login