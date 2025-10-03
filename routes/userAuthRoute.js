const express = require("express");
const router = express.Router();
const authController = require("../controllers/userAuthController");
const authenticate = require("../middleware/auth");

// Public routes
router.post("/registers", authController.createnewuser);
router.post("/login", authController.login);
router.get("/refresh", authController.handleRefreshToken);

// Protected routes (require authentication)
router.get("/users", authenticate, authController.getAllusers);
router.get("/profile", authenticate, authController.getOneuser);
router.post("/logout", authenticate, authController.logout);
router.patch("/update", authenticate, authController.userupdate);
router.delete("/delete", authenticate, authController.deleteuser);
router.get("/testauth", authenticate, authController.testAuth);

module.exports = router;