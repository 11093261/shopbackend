const Shipping = require("../models/shipping");
const createShipping = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return res.status(400).json({ message: 'Valid shipping address is required' });
    }
    const existingShipping = await Shipping.findOne({ userId: req.user._id });
    
    if (existingShipping) {
      existingShipping.shippingAddress = {
        fullName: shippingAddress.fullName || "",
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zip: shippingAddress.zip || "",
        phone: shippingAddress.phone || ""
      };
      
      await existingShipping.save();
      return res.status(200).json(existingShipping);
    } else {
      const createdShippingAddress = new Shipping({
        userId: req.user._id,
        shippingAddress: {
          fullName: shippingAddress.fullName || "",
          street: shippingAddress.street || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          zip: shippingAddress.zip || "",
          phone: shippingAddress.phone || ""
        }
      });

      console.log(createdShippingAddress)
      
      await createdShippingAddress.save();
      return res.status(201).json(createdShippingAddress);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error just occurred"
    });
  }
};
const getuserShippingDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const shipping = await Shipping.find({ userId });
    if (!shipping || shipping.length === 0) {
      return res.status(200).json([]); 
    }

    console.log(shipping)
    
    res.status(200).json({
      success:"sucessfully fetched",
      shipping
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const getShippingById = async (req, res) => {
  try {
    const shippingId = req.params.shippingId;
    const shipping = await Shipping.findById(shippingId);
    
    if (!shipping) {
      return res.status(404).json({ message: "No shipping address found" });
    }
    
    // Check if the shipping address belongs to the authenticated user
    if (shipping.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    console.log(shipping,"shipping info is checked")
    
    res.json(shipping);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  createShipping,
  getuserShippingDetails,
  getShippingById
};