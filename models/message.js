const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  sellerId: { type: String, required: true },
  userId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sender: { type: String, enum: ['buyer', 'seller'], required: true },
  senderName: { type: String, required: true }
});

module.exports = mongoose.model('Message', messageSchema);