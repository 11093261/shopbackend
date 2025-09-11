const express = require('express');
const productRouter = express.Router();
const upload = require("../config/cloudinary");
const sellerAuth = require("../middleware/auth")
const multer = require("multer")
const router = express.Router();
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Please check your file upload field name.`
      });
    }
    if (err.code === 'LIMIT_FILE_SIZE'){
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  next(err);
};
const {
  getSellerDashboard,
  getSellerInfo,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/sellerController");
const UserPayment = require('../models/userpayment');
const checkAndUpdatePostCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userPayment = await UserPayment.findOne({ userId });
    
    if (!userPayment) {
      const newUserPayment = new UserPayment({
        userId,
        email: req.user.email,
        postsCount: 1
      });
      await newUserPayment.save();
      return next();
    }
    const FREE_POST_LIMIT = 10
    if (userPayment.postsCount < FREE_POST_LIMIT) {

      userPayment.postsCount += 1;
      await userPayment.save();
      return next();
    }
    
    const paidPostsUsed = userPayment.postsCount - FREE_POST_LIMIT;
    const postsPurchased = userPayment.paymentHistory.reduce(
      (total, payment) => total + (payment.postsPurchased || 0), 0
    );
    
    if (paidPostsUsed < postsPurchased){
      userPayment.postsCount += 1;
      await userPayment.save();
      return next();
    }
    res.status(402).json({
      error: 'Payment required',
      message: 'You have exhausted your available posts. Please make a payment to continue.',
      paymentRequired: true
    });
  } catch (error) {
    console.error('Post count check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add this middleware to check if payment is already in progress
const checkPaymentInProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userPayment = await UserPayment.findOne({ userId });
    
    if (userPayment && userPayment.paymentReference && !userPayment.hasPaid) {
      return res.status(400).json({ 
        error: 'Payment already in progress. Please complete or cancel the previous payment.' 
      });
    }
    next();
  } catch (error) {
    console.error('Payment progress check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get("/dashborad",sellerAuth,getSellerDashboard)
router.get("/info",sellerAuth,getSellerInfo)
router.post("/seller",sellerAuth, checkPaymentInProgress, checkAndUpdatePostCount , upload.single("imageUrl"), handleMulterError, createProduct);
router.put("/seller/:id", sellerAuth, upload.single("imageUrl"), handleMulterError, updateProduct);
router.delete("/productdelete/:productId", sellerAuth, deleteProduct);
module.exports = router;

