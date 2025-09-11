require('dotenv').config();
const express = require('express');
const { Paystack } = require('paystack-sdk');
const router = express.Router();
const userpost = require('../models/Order'); // Import your Order model
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);


router.post('/paystack/initialize', async (req, res) => {
  try {
    const { email, amount, orderId } = req.body;
    
    if (!email || !email.trim() || !orderId) {
      return res.status(400).json({ error: 'Email and order ID are required' });
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Calculate platform fee (10%)
    const platformFee = Math.round(amountNum * 0.1);
    const customerCharge = amountNum + platformFee;

    // Validate total amount
    if (customerCharge < 100 || customerCharge > 100000000) {
      return res.status(400).json({ 
        error: `Amount must be between ₦1 and ₦1,000,000 after fees` 
      });
    }

    // Create payment with fee details in metadata
    const response = await paystack.transaction.initialize({
      email: email.trim(),
      amount: customerCharge,
      currency: "NGN",
      callback_url: `${process.env.FRONT_END_URL}/verify-payment`,
      metadata: {
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId
          },
          {
            display_name: "Platform Fee",
            variable_name: "platform_fee",
            value: platformFee
          }
        ]
      }
    });

    if (response.status && response.data) {
      // Update order with payment reference
      await Order.findByIdAndUpdate(orderId, {
        paymentReference: response.data.reference,
        platformFee: platformFee / 100 // Convert to Naira
      });

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

// Verify payment and update order
router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const reference = req.params.reference;
    const response = await paystack.transaction.verify(reference);

    if (response.status && response.data.status === 'success') {
      const { metadata } = response.data;
      const orderId = metadata?.custom_fields?.find(f => f.variable_name === 'order_id')?.value;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID not found in payment metadata'
        });
      }

      // Update order status and payment details
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          status: 'paid',
          paymentDate: new Date(),
          paymentMethod: 'paystack',
          paymentDetails: {
            reference: response.data.reference,
            channel: response.data.channel,
            amount: response.data.amount / 100, // Convert to Naira
            fee: response.data.fees / 100,      // Convert to Naira
            platformFee: metadata?.custom_fields?.find(f => f.variable_name === 'platform_fee')?.value / 100
          }
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // ADMIN FEE COLLECTION LOGIC (10%)
      const adminFee = updatedOrder.paymentDetails.platformFee;
      console.log(`Admin fee collected: ₦${adminFee.toFixed(2)} from order ${orderId}`);
      
      res.json({
        success: true,
        order: updatedOrder,
        payment: response.data
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

module.exports = router;