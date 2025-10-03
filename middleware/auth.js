const jwt = require("jsonwebtoken");
const userAuth = require("../models/userAuth");
require("dotenv").config();

const authenticate = async (req, res, next) => {
    try {
        // Extract token from cookies only (no Authorization header for production)
        let token = req.cookies.accessToken || req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find user
        const userId = decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await userAuth.findById(userId).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Server error during authentication" });
    }
};

module.exports = authenticate;