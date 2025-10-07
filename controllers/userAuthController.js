const userAuth = require("../models/userAuth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require('express-validator');
require("dotenv").config();

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000 // 1 hour
};

const getAllusers = async (req, res) => {
    try {
        const users = await userAuth.find().select("-password -refreshToken");
        return res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const getOneuser = async(req,res)=>{
  try {
    const user = await userAuth.findOne({
      _id:req.user.id,
      userId:req.user_id
    })
    if(!user){
      return res.status(401).json({message:"user not found"})
    }
    res.json({user})
  } catch (error) {
    console.log(error)
  }
}

const createnewuser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const duplicate = await userAuth.findOne({ email }).exec();
        if (duplicate) {
            return res.status(409).json({ message: "You already have an account, please login" });
        }

        const hashedPwd = await bcrypt.hash(password, 10);
        const user = await userAuth.create({
            name,
            email,
            phone,
            password: hashedPwd,
        });
        
        const token = jwt.sign(
          { userId: user._id.toString() },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '1h' }
        );

        // Set cookies only
        res.cookie('accessToken', token, cookieOptions);
        res.cookie('token', token, cookieOptions);
        
        return res.status(201).json({ 
          message: "User created successfully",
          userId: user._id,
          name: user.name
        });
    } catch (error) {
        console.error("Registration error:", error.message); 
        return res.status(500).json({ message: "Server error: " + error.message });
    }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Find user - don't reveal if user exists or not
    const user = await userAuth.findOne({ email });
    
    // Always use the same generic message for security
    const genericError = "Invalid email or password";
    
    // If no user found or password invalid, return same error
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: genericError });
    }
    
    console.log('User found, verifying password...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: genericError });
    }
    
    console.log('Password valid, generating tokens...');
    
    // Token generation
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    
    // Store refreshToken in database
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set cookies - REMOVED redundant 'token' cookie
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      path: '/',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    console.log('Login successful for user:', user.email);
    
    res.json({
      userId: user._id,  
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

const verifyToken = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await userAuth.findById(decoded.userId).select("-password -refreshToken");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(500).json({ message: "Server error during verification" });
  }
};

const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);

    const user = await userAuth.findById(decoded.userId).exec(); 
    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }
    
    const newAccessToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie('accessToken', newAccessToken, cookieOptions);
    res.cookie('token', newAccessToken, cookieOptions);
    
    res.json({ 
      message: "Token refreshed successfully",
      accessToken: newAccessToken 
    });
  });
}

const logout = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    
    if (userId) {
      const user = await userAuth.findById(userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    
    res.clearCookie('accessToken');
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

const userupdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;
    const updateData = { name, email, phone };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await userAuth.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "User updated successfully",
      user: updatedUser 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteuser = async (req, res) => {
  try {
    const { id } = req.params; 
    const deletedUser = await userAuth.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "User deleted successfully",
      user: deletedUser 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const testAuth = async (req, res) => {
  try {
    res.json({ 
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
};

module.exports = {
    getAllusers,
    createnewuser,
    login,
    getOneuser,
    handleRefreshToken,
    userupdate,
    deleteuser,
    logout,
    testAuth,
    verifyToken
};