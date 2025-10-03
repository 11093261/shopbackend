const express = require("express");
const router = express.Router();
const authController = require("../controllers/userAuthController");
const authenticate = require("../middleware/auth");

// User routes
router.get("/registers", authController.getAllusers);
router.get("/verify/:id", authenticate, authController.getOneuser);
router.post("/registers", authController.createnewuser);

// Authentication routes
router.post("/login", authController.login);
router.get("/refresh", authController.handleRefreshToken);
router.post("/logout", authenticate, authController.logout);
router.patch("/update", authenticate, authController.userupdate);
router.delete("/delete", authenticate, authController.deleteuser);
router.get("/testauth",authenticate,authController.testAuth )

module.exports = router;