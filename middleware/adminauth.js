const Admins = require("../models/admin")
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    // Verify token first
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Then find admin
    const admin = await Admins.findOne(decoded.userId);
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    
    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate