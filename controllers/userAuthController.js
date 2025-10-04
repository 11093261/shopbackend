const userAuth = require("../models/userAuth");
const userPost = require("../models/chat")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const redis = require("redis")
const client = redis.createClient({
  host: "localhost",
  port: 6379 
});

client.on('error', (err) => {
  console.log('Redis Client Error', err);
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
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
        
        // Consistent token payload
        const token = jwt.sign(
          { userId: user._id.toString() },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '1h' }
        );

        // Set cookies only - no token in response body for production
        res.cookie('accessToken', token, cookieOptions);
        res.cookie('token', token, cookieOptions);
        
        return res.status(201).json({ 
          message: "User created successfully",
          userId: user._id,
          name: user.name
          // No token in response for production
        });
    } catch (error) {
        console.error("Registration error:", error.message); 
        return res.status(500).json({ message: "Server error: " + error.message });
    }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const user = await userAuth.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
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
    
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set cookies only - no tokens in response body
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('token', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      userId: user._id,  
      name: user.name,
      email: user.email
      // No accessToken in response for production
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// Add this to your userAuthController.js
const verifyToken = async (req, res) => {
  try {
    // The token should be in cookies, not headers for your setup
    const token = req.cookies.accessToken || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Find the user
    const user = await userAuth.findById(decoded.userId).select("-password -refreshToken");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Return user information
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
      { userId: user._id.toString() }, // Consistent format
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Set multiple cookies
    res.cookie('accessToken', newAccessToken, cookieOptions);
    res.cookie('token', newAccessToken, cookieOptions); // Add this
    
    res.json({ 
      message: "Token refreshed successfully",
      accessToken: newAccessToken 
    });
  });
}

const logout = async (req, res) => {
  try {
    // Get user ID from token if available, otherwise from body/params
    const userId = req.user?._id || req.body.userId;
    
    if (userId) {
      const user = await userAuth.findById(userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    
    // Clear all possible cookies
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

// Add a test endpoint to verify tokens are working
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
    testAuth ,
    verifyToken
};