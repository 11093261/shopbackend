

const express = require("express");
const router = express.Router();
const authController = require("../controllers/userAuthController");
const authenticate = require("../middleware/auth"); // For protected routes

// User routes
router.get("/registers", authController.getAllusers);
router.get("/verify/:id",authenticate,authController.getOneuser)
router.post("/registers", authController.createnewuser);

// Authentication routes
router.post("/login", authController.login); // Fixed: removed middleware
router.get("/refresh",authenticate, authController.handleRefreshToken);
router.patch("/update",authenticate, authController.userupdate)
router.delete("/delete",authenticate, authController.deleteuser)
module.exports = router;
