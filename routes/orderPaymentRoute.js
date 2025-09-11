const express = require("express")
const route = express.Router()
const orderPaymentController = require("../controllers/paymentOrder")
const userMiddleware = require("../middleware/auth")
route.post("/orderpayment",userMiddleware,orderPaymentController.createpayments)
module.exports = route