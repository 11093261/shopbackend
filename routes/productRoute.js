  const express = require("express");
const Product = require("../models/product");
const Cart = require("../models/cart");
const upload = require("../config/cloudinary");
const authenticateUser = require("../middleware/auth");
const productController = require("../controllers/productController")

const router = express.Router();
router.get('/product',productController.getproducts );
router.get('/seller/:id',authenticateUser, productController.getproduct);
router.post('/product', 
  authenticateUser, 
  upload.single('imageUrl'), 
  productController.createproduct
);
router.delete("/product:id",authenticateUser, productController.deleteproduct)
module.exports = router;