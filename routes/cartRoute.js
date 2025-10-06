const express = require("express");
const cartController = require("../controllers/cartController")
const authenticateUser = require("../middleware/auth");

const router = express.Router();
router.get('/cart',cartController.getCart)

router.post("/cart",authenticateUser,cartController.postcart)
module.exports = router



