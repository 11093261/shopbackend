const express = require("express")
const route = express.Router()
const authMiddle = require("../middleware/auth")
const sellersTextController = require("../controllers/SellerTextController")
route.get("/getsellertext",authMiddle,sellersTextController.getSellerText)
route.post("/postsellertext",sellersTextController.sellerMessage)
module.exports = route

