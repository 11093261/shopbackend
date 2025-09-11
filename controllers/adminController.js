
const Product = require('../models/product');
const Order = require('../models/Order');
const User = require('../models/userAuth');
const bcrypt = require('bcryptjs');
const mongoose = require("mongoose")
// const Admin = require("../models/admin")
const jwt = require('jsonwebtoken');
const Admins = require("../models/admin");
require("dotenv").config()


const loginAdmin = async (req, res) => {
    
    try {
      const { username, password } = req.body;
      if(!username || !password){
        return res.status(401).json({message:"All fields are required"})
      }
      const admin = await Admins.findOne({username:"admin"});
      if(admin){
        const hpwd = await bcrypt.hash(password,10);
        const createdItems = new Admins({
          username,
          password:hpwd
   
        })

        await createdItems.save()
        if(createdItems){
          console.log(createdItems)

          const token = jwt.sign(
            { adminId:mongoose.Types.objectId},
            process.env.ADMIN_ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
          );
          console.log(token)
          res.json(
            {
              token,
            }
          );
        }
      }  
  
         
    }catch(error){
      
      console.error('Login error:', error);
      
      res.status(500).json({ message: 'Server error' });
      
      // Handle specific MongoDB errors
      if (error.name === 'MongoServerError') {
        if (error.code === 11000) {
          return res.status(500).json({ 
            message: 'Database index conflict. Please contact administrator.'
          });
        }
      }
    }

    

  
};

const getAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    
    res.json({
      id: admin._id,
      username: admin.username,
      createdAt: admin.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error){
        res.status(500).json({ message: 'Server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const imageUrl = req.file ? req.file.path : null;

        const product = new Product({
            ...req.body,
            createdBy: req.user._id,
            image: imageUrl
        });

        const savedProduct = await product.save();
        res.status(201).json({ message: "Product created", product: savedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Add to adminController.js
// const verifyToken = async (req, res) => {
//   try {
//     // This should be called by authMiddleware first
//     res.json({ 
//       isAdmin: req.user.role === 'Admin',
//       userId: req.user.userId
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };
// Dashboard Controllers
// controllers/adminController.js
const getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    
    const pendingOrders = await Order.countDocuments({ status: 'Processing' });
    
    // Fix: Use the correct model name 'User'
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'userId',
        model: 'User',  // Use the exact model name
        select: 'name email'
      });

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
      pendingOrders,
      recentOrders: recentOrders.map(order => ({
        _id: order._id,
        customer: order.userId?.name || 'Unknown',
        date: order.createdAt,
        amount: order.total,
        status: order.status
      }))
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(orders.map(order => ({
            _id: order._id,
            customer: order.sellername || 'Unknown',
            date: order.createdAt,
            amount: order.total,
            status: order.status,
            items: order.items,
            shippingAddress: order.shippingAddress,
            payment: order.payment
        })));
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const {status} = req.body
        console.log(req.body)
        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status},
            { new: true }
        );
        console.log(order)

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password -refreshToken');
        res.json(users);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['Admin', 'Editor', 'Viewer', 'User'];
        
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: "User deleted successfully",
            userId: deletedUser._id
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
const getAdminpost = async(req,res)=>{
  try{
    const adminPost = await Admins.find()
    if(!adminPost){
      return res.status(401).json({message:"No post found"})
    }
    res.json(adminPost)

  }catch(error){
    console.log(error)

  }
}

const createAdminPost = async(req,res)=>{
  try{
    const {adminpost} = req.body
    if(!adminpost){
      return res.status(401).json({message:'no post sent'})
    }
    const createAdminPost = new Admins({
      adminpost
    }) 
    await createAdminPost.save()

  }catch(error){
    console.log(error)

  }
}



module.exports = {
    loginAdmin,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getDashboardSummary,
    getAllOrders,
    updateOrderStatus,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAdmin,
    getAdminpost,
    createAdminPost
};



