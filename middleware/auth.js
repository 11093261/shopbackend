const jwt = require("jsonwebtoken");
const userAuth = require("../models/userAuth");
require("dotenv").config()
const verifyAdminToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token provided or invalid format" });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Find user and verify admin role
        const user = await userAuth.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        

        // Attach full user to request
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

module.exports = verifyAdminToken;