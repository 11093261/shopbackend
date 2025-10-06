const express = require("express");
const router = express.Router();
const authController = require("../controllers/userAuthController");
const authenticate = require("../middleware/auth");
const { body, validationResult } = require('express-validator');

// Public routes
router.post("/registers", authController.createnewuser);

// Add validation middleware to your route
router.post("/login", [
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.login);
router.get("/refresh", authController.handleRefreshToken);

// Protected routes (require authentication)
router.get("/users", authenticate, authController.getAllusers);
router.get("/profile", authenticate, authController.getOneuser);
router.post("/logout", authenticate, authController.logout);
router.patch("/update", authenticate, authController.userupdate);
router.delete("/delete", authenticate, authController.deleteuser);
router.get("/testauth", authenticate, authController.testAuth);
router.get("/verify", authenticate, authController.verifyToken);

module.exports = router;