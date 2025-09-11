const fs = require("fs")
const format = require("date-fns")
const path = require("path")
const Eventllogger = (message,filename)=>{
    const dateTime = `${format(new Date ("yyyy:mm:dd","hh,mm,ss"))}/n`
    const logger = (`${message.url} /t ${message.origin} /t ${message.headers}`, filename)

}

const log = async(req,res,next)=>{
    Eventllogger(`${req.url}/t${req.origin}/t${req.body}`)
    if(!fs.existsSync(path.join(__dirname,"..",))){
        fs.mkdir(path.join(__dirname,"","log"))
    }
}

module.exports = {
    Eventllogger,
    log
}




