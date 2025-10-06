const express = require('express');
const orderRoute = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

orderRoute.get("/getorders", auth, async (req, res) => {
  try {
    const findOrder = await Order.findOne({ userId: req.user._id });
    console.log(findOrder)
    if (!findOrder || findOrder.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }
    res.json(findOrder);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "server error occur"
    });
  }
});
orderRoute.get("/getOrder/orderId",async(req,res)=>{
  try{

    const orderId = req.user_id
    const foundId = Order.findById(orderId)
    if(!foundId){
      return res.status(401).json({message:"failed"})
    }
  }catch(error){
  }
})

orderRoute.post('/postorders', auth, async (req, res) => {
  try {
    const { shippingAddress,  subtotal, shippingFee, tax, total, cartItems } = req.body;
    
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ message: 'Valid shipping address is required' });
    }
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({ message: 'Valid subtotal is required' });
    }

    const order = new Order({
      userId: req.user._id,
      items: cartItems || [], 
      shippingAddress: {
        fullName: shippingAddress.fullName || "",
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zip: shippingAddress.zip || "",
        phone: shippingAddress.phone || ""
      },
      subtotal,
      shippingFee: shippingFee || 0,
      tax: tax || 0,
      total
    });
    let savedOrder;
    let retries = 3;
    
    while (retries > 0) {
      try {
        savedOrder = await order.save();
        break;
      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern.orderNumber) {
          order.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          retries--;
        } else {
          throw saveError;
        }
      }
    }

    if (!savedOrder) {
      throw new Error('Failed to create order after retries');
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate order detected. Please try your order again.',
        error: 'Duplicate order'
      });
    }
    
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

module.exports = orderRoute;