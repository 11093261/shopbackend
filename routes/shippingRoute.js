const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shippingController");
const authenticateMiddleware = require("../middleware/auth");

router.post("/shipping", authenticateMiddleware, shippingController.createShipping);
router.get("/user-shipping", authenticateMiddleware, shippingController.getuserShippingDetails);
router.get("/getshipping/:shippingId", authenticateMiddleware, shippingController.getShippingById);

module.exports = router;