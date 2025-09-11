const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {

    orderNumber: {
      type: String,
      unique: true,
      default: function() {
        return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      sellername: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      location:String,
      imageUrl: {
        type: String,
        default: 'default-image.jpg'
      }
    }],
    shippingAddress:{
      type: Object,
      required: true
    },
    subtotal:{
      type: Number,
      required: true
    },
    shippingFee:{
      type: Number,
      default: 0
    },
    tax:{
      type: Number,
      default: 0
    },
    total:{
      type: Number,
      required: true
    },
    status:{
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);