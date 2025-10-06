const express = require("express")
const path = require("path")
const root = express.Router()
root.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"views","index.html"))
})

module.exports=root