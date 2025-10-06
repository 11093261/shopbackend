require('dotenv').config();
const express = require('express');
const { Paystack } = require('paystack-sdk');
const router = express.Router();
const UserPayment = require('../models/userpayment');
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);
const mongoose = require("mongoose");
const authenticateUser = require("../middleware/auth")
const FREE_POST_LIMIT = 10;
const POSTS_PER_PAYMENT = 10;
const PAYMENT_AMOUNT = 10000; 
const checkPostLimit = async (req, res, next) => {
  try {
    const userId = req.user._id; 
    const userPayment = await UserPayment.findOne({ userId });
    
    if (!userPayment) {
      return res.status(404).json({ error: 'User payment record not found' });
    }
    if (userPayment.postsCount < FREE_POST_LIMIT) {
      req.postsAllowed = true;
      req.remainingFreePosts = FREE_POST_LIMIT - userPayment.postsCount;
      return next();
    }
    const paidPostsUsed = userPayment.postsCount - FREE_POST_LIMIT;
    const postsPurchased = userPayment.paymentHistory.reduce(
      (total, payment) => total + (payment.postsPurchased || 0), 0
    );
    
    if (paidPostsUsed < postsPurchased) {
      req.postsAllowed = true;
      req.remainingPaidPosts = postsPurchased - paidPostsUsed;
      return next();
    }
    req.postsAllowed = false;
    next();
  } catch (error) {
    console.error('Post limit check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
router.post("/payment/initialize",authenticateUser, checkPostLimit, async (req, res) => {
  try {
    if (req.postsAllowed){
      return res.status(400).json({ 
        error: 'You still have posts available. No payment needed.' 
      });
    }
    
    const userId = req.user.id;
    const userEmail = req.user.email; 
    
    const response = await paystack.transaction.initialize({
      email: userEmail,
      amount: PAYMENT_AMOUNT,
      currency: "NGN",
      callback_url: `${process.env.FRONT_END_URL}/verify-payment`,
      metadata: {
        custom_fields: [
          {
            display_name: "user_id",
            variable_name: "user_id",
            value: userId
          },
          {
            display_name: "posts_purchased",
            variable_name: "posts_purchased",
            value: POSTS_PER_PAYMENT
          }
        ]
      }
    });
    console.log(response.data)
    
    if (response.status && response.data) {
      await UserPayment.findOneAndUpdate(
        { userId },
        { 
          paymentReference: response.data.reference,
          hasPaid: false 
        }
      );

      res.json({
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference
      });
    } else {
      throw new Error(`Paystack error: ${response.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ 
      error: 'Payment initialization failed',
      details: error.message 
    });
  }
});

router.get('/payment/verify/:reference', async (req, res) => {
  try {
    const reference = req.params.reference;
    const response = await paystack.transaction.verify(reference);

    if (response.status && response.data.status === 'success') {
      const { metadata } = response.data;
      const userId = metadata?.custom_fields?.find(f => f.variable_name === 'user_id')?.value;
      const postsPurchased = metadata?.custom_fields?.find(f => f.variable_name === 'posts_purchased')?.value;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID not found in payment metadata'
        });
      }

      // Update user payment record
      const updatedPayment = await UserPayment.findOneAndUpdate(
        { userId: mongoose.Types.ObjectId(userId) },
        {
          hasPaid: true,
          lastPaymentDate: new Date(),
          $push: {
            paymentHistory: {
              date: new Date(),
              amount: response.data.amount / 100, // Convert to Naira
              reference: response.data.reference,
              postsPurchased: parseInt(postsPurchased) || POSTS_PER_PAYMENT
            }
          }
        },
        { new: true }
      );

      if (!updatedPayment) {
        return res.status(404).json({
          success: false,
          error: 'User payment record not found'
        });
      }
      
      res.json({
        success: true,
        message: `Payment successful! You can now post ${POSTS_PER_PAYMENT} products.`,
        updatedPayment
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.message || 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      details: error.message
    });
  }
});


router.get('/posts/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const userPayment = await UserPayment.findOne({ userId });
    
    if (!userPayment) {
      return res.status(404).json({ error: 'User payment record not found' });
    }
    
    let remainingFreePosts = 0;
    let remainingPaidPosts = 0;
    let needsPayment = false;
    
    if (userPayment.postsCount < FREE_POST_LIMIT) {
      remainingFreePosts = FREE_POST_LIMIT - userPayment.postsCount;
    } else {
      const paidPostsUsed = userPayment.postsCount - FREE_POST_LIMIT;
      const postsPurchased = userPayment.paymentHistory.reduce(
        (total, payment) => total + (payment.postsPurchased || 0), 0
      );
      
      remainingPaidPosts = postsPurchased - paidPostsUsed;
      
      if (remainingPaidPosts <= 0) {
        needsPayment = true;
      }
    }
    
    res.json({
      postsCount: userPayment.postsCount,
      remainingFreePosts,
      remainingPaidPosts,
      needsPayment,
      hasPaid: userPayment.hasPaid
    });
  } catch (error) {
    console.error('Post status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
