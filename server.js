
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const http = require("http"); 
const { Server } = require("socket.io");
const cors = require("cors");
const cookie_parser = require("cookie-parser");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3200;
const app = express();
const dbconnect = require("./config/dbconnnect");

// Routes imports
const adminRoute = require("./routes/adminRoute");
const productRouter = require("./routes/productRoute");
const sellerRoute = require("./routes/sellerRoute");
const paymentRoute = require("./routes/Payment");
const authRoute = require("./routes/userAuthRoute");
const OrderRoute = require("./routes/OrderRoute");
const chatRoute = require("./routes/chatRoute");
const sellertextRoute = require("./routes/sellerTextRoute");
const Message = require('./models/message');
const Conversation = require('./models/conversation');
const postpaymentRoute = require("./routes/postpayment")
const shippingRoute = require("./routes/shippingRoute")
const orderPaymentRoute = require("./routes/orderPaymentRoute")

// Create HTTP server
const server = http.createServer(app); // Now http is defined

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('join_chat', async (data) => {
    const { roomId, sellerId, userId, userType, userName } = data;
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Fetch previous messages
    try {
      const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
      socket.emit('previous_messages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }

    // For sellers, fetch their conversations
    if (userType === 'seller') {
      try {
        const conversations = await Conversation.find({ sellerId }).sort({ timestamp: -1 });
        socket.emit('previous_conversations', conversations);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    }
  });

  // Handle new messages
  socket.on('send_message', async (data) => {
    const { roomId, sellerId, userId, message, sender, senderName } = data;
    const newMessage = new Message({
      roomId,
      sellerId,
      userId,
      message,
      sender,
      senderName,
      timestamp: new Date()
    });

    try {
      await newMessage.save();
      
      // Update conversation
      await Conversation.findOneAndUpdate(
        { sellerId, buyerId: userId },
        { 
          buyerName: senderName, 
          lastMessage: message, 
          timestamp: new Date() 
        },
        { upsert: true, new: true }
      );

      // Emit to all in the room
      io.to(roomId).emit('message_received', newMessage);

      // Notify seller if not in room
      if (sender === 'buyer') {
        socket.to(`seller_${sellerId}`).emit('new_message_notification', {
          buyerId: userId,
          buyerName: senderName,
          message,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});




// Middleware
app.use(cookie_parser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

dbconnect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "views", "index.html")));



app.use("/api", productRouter);
app.use("/api", adminRoute);
app.use("/api", sellerRoute);
app.use("/upload", express.static("upload"));
app.use("/auth", authRoute);
app.use("/api", paymentRoute);
app.use("/api/orders", OrderRoute);
app.use("/api", chatRoute);
app.use("/api", sellertextRoute);
app.use("/api",postpaymentRoute)
app.use("/api",shippingRoute)
app.use("/api",orderPaymentRoute)
app.all('/', (req, res) =>{
  if (req.accepts("html")){
    res.sendFile(path.join(__dirname, "..", "index.html"));
  } else if (req.accepts("json")) {
    res.status(404).json({ message: "404 NOT FOUND" });
  } else {
    res.type("text").send("json");
  }
});
app.use(morgan("dev"));
mongoose.connection.once("open", () => {
  console.log("Database connected");
  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 
});

