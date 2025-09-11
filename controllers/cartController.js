const cartModel = require("../models/cart")
const getCart = async(req,res)=>{
    try {
        const products = await cartModel.find()
        if(!products){
            return res.status(400).json({message:"unable to find product"})
        }
        res.json(products)
    } catch (error) {
         if(error){
            return res.status(500).json({message:error.message})
        }
        
    }
}
const postcart = async (req, res) => {
    try {
        const { productId, quantity} = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({ 
                message: "Product ID and quantity are required" 
            });
        }

        const newCartItem = new cartModel({
            userId: req.user._id,     
            productId,               
            quantity,
            
        });
        console.log(newCartItem)

        await newCartItem.save();
        res.status(201).json({
            message: "Product added to cart",
            cartItem: newCartItem
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getCart,
    postcart
}