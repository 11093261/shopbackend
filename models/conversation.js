const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  lastMessage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);