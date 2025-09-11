const mongoose = require("mongoose")
const cart = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  quantity: { type: Number, required: true, min: 1 },

}, { strict: true });


module.exports = mongoose.model("cart",cart)
