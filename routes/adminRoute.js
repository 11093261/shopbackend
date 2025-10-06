const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require("../middleware/adminauth");
const upload = require('../config/cloudinary'); // Multer configuration for file uploads
router.post("/adminlogin", adminController.loginAdmin);
router.get("/profile", adminAuth, adminController.getAdmin);
router.get('/products', 
  authMiddleware, 
  
  adminController.getAllProducts
);



router.post('/products', 
  authMiddleware, 
  
  upload.single('image'), 
  adminController.createProduct
);

router.put('/products/:id', 
  authMiddleware, 
  
  adminController.updateProduct
);

router.delete('/products/:id', 
  authMiddleware, 
  
  adminController.deleteProduct
);
router.get('/orders/summary', 
  authMiddleware, 
  adminController.getDashboardSummary
);
router.get('/orders', 
  authMiddleware, 
  adminController.getAllOrders
);

router.put('/order/:id/status', 
  authMiddleware, 
  adminController.updateOrderStatus
);
router.get('/users', 
  authMiddleware, 
  adminController.getAllUsers
);

router.put('/users/:id/role', 
  authMiddleware, 
  adminController.updateUserRole
);

router.delete('/users/:id', 
  authMiddleware, 
  adminController.deleteUser
)
router.get("/getAdmin",adminController.getAdminpost)
router.post("/postAdminpost",adminController.createAdminPost)
module.exports = router;