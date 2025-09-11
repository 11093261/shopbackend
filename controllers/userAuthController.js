const userAuth = require("../models/userAuth");
const userPost = require("../models/chat")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const redis = require("redis")
const client = redis.createClient({
  host:"localhost",
  port:3200

})

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
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

        return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
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
      { userId: user._id.toString(), email: user.email },  
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();
    res.json({
      accessToken,  
      userId: user._id,  
      name: user.name
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.jwt;
  if (!refreshToken) return res.sendStatus(401);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);

    const user = await userAuth.findById(decoded.userId).exec(); 
    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }
    const newAccessToken = jwt.sign(
      { userId: user._id }, 
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    res.json({ accessToken: newAccessToken });
  });
}
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



module.exports = {
    getAllusers,
    createnewuser,
    login,
    getOneuser,
    handleRefreshToken,
    userupdate,
    deleteuser
};
