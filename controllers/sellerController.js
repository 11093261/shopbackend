const Product = require("../models/product");
const createProduct = async (req, res) => {
  try {
    const { sellername, price, description, location, phonenumber, quantity} = req.body;
    if (!sellername || !price || !description  || !location || !quantity || !phonenumber) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newProduct = new Product({
      sellername,
      price,
      description,
      quantity,
      phonenumber,
      location,
      imageUrl: req.file ? req.file.path : null  
    });
    console.log(newProduct)

    const savedProduct = await newProduct.save();
    console.log(savedProduct)
    res.status(201).json({ message: "Product created", product: savedProduct });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { id } = req.params; 
    const foundProduct = await Product.findById(id);
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (foundProduct.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    Object.assign(foundProduct, req.body);
    if (req.file) foundProduct.imageUrl = req.file.path;

    const updatedProduct = await foundProduct.save();
    res.status(200).json({ message: "Product updated", product: updatedProduct });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const productId = req.user._id 
    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (foundProduct.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Product.deleteOne({ _id: id });
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const sellerpost = async(req,res)=>{
  try {
    const seller = await Product.findById(req.user.id)
    if(seller.postRemainng <= 0){
      return res.status(400).json({message:"No avaliable post to , please make payment."})
    }
    const products = new Product({
      ...req.body,
      sellerId:req.user.id
    })
    const savedProducts = await products.save()
    await Product.findByIdAndUpdate(req.user.id,{
      $inc:{postsRemaining: -1 , postUsed: 1}
    })
    res.status(201).json(savedProducts)
  } catch (error) {
    console.log(error)
    res.status(500).json({message:"server error"})
    
  }
}
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const seller = await User.findById(sellerId).select('-password');
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    const { productId, sort, limit } = req.query;
    const query = { createdBy: sellerId };
    
    if (productId) {
      query._id = productId;
    }
    
    const products = await Product.find(query)
      .sort(sort || '-createdAt')
      .limit(Number(limit) || 0);
    res.json({
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        phonenumber: seller.phonenumber,
        location: seller.location,
        postRemaining: seller.postRemaining,
        postUsed: seller.postUsed,
        lastPayment: seller.lastPayment
      },
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getSellerInfo = async (req, res) =>{
  try {
    const sellerId = req.user._id;
    
    const seller = await User.findById(sellerId).select('-password');
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    res.json({
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      businessName: seller.businessName,
      phonenumber: seller.phonenumber,
      location: seller.location,
      postRemaining: seller.postRemaining,
      postUsed: seller.postUsed,
      lastPayment: seller.lastPayment,
      paymentHistory: seller.paymentHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  createProduct,
  getSellerDashboard,
  getSellerInfo,
  updateProduct,
  deleteProduct,
  sellerpost
}