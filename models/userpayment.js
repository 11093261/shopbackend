const mongoose = require("mongoose");

const userPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId, 
    ref: "userAuth",
    required: true
  },
  email: {
    type: String,
    required: true
  },
  postsCount: {
    type: Number,
    default: 0
  },
  hasPaid: {
    type: Boolean,
    default: false
  },
  paymentReference: {
    type: String,
    default: null
  },
  paymentHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      default: 0
    },
    reference: String,
    postsPurchased: Number
  }],
  lastPaymentDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("userpayment", userPaymentSchema);