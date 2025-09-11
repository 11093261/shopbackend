const productmodel = require("../models/product")
const userAuth = require("../models/userAuth")

const getproducts = async (req, res) => {
  try {
    const { productId, sort, limit } = req.query; 
    const query = productId ? { productId } : {};
    
    const products = await productmodel.find(query)
      .sort(sort || '-createdAt')
      .limit(Number(limit) || 0); 

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add this to your product routes or create a new seller route
// In your backend routes
const getproduct = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await productmodel.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    res.json({
      sellername: seller.sellername,
      phonenumber: seller.phonenumber,
      location: seller.location,
      description: seller.description,
      imageUrl: seller.imageUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const createproduct = async(req,res)=>{
    try {
        const {sellername,description,price,quantity,location,phonenumber}=req.body
        const created = new productmodel({
            sellername,
            description,
            price,
            location,
            quantity,
            phonenumber,
            productId:req.userAuth.id,
            imageUrl:req.file.path


        })
        await created.save()
        if(created){
            res.status(200).json({message:"successfully created"})

        }
    } catch (error) {
        res.status(500).json({message:error.message})
        
    }
}

const deleteproduct = async(req,res)=>{
    try {
        const{id}= req.params
        if(id){
            const findproduct = await productmodel.findById(id)
            if(!findproduct){
                return res.status(400).json({message:"product does not exist"})
            }
            const deleteproducts = await productmodel.findByIdAndDelete(findproduct)
            if(deleteproducts){
                return res.status(200).json({message:"product successfully deleted"})
            }
        }
    } catch (error) {
        console.log(error)
        
    }

}

module.exports = {
    getproducts,
    getproduct,
    createproduct,
    deleteproduct
}