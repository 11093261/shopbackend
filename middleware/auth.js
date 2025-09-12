const jwt = require("jsonwebtoken");
const userAuth = require("../models/userAuth");
require("dotenv").config();

const authenticate = async (req, res, next) => {
    try {
        // Extract token from cookies
        const token = req.cookies.accessToken;
        
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find user
        const user = await userAuth.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        console.error("Token verification error:", error);
        res.status(500).json({ message: "Server error during authentication" });
    }
};

module.exports = authenticate;