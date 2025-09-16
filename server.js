const express = require("express");
const path = require("path");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config()
const cookie_parser = require("cookie-parser");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3200;
const app = express()

const cookieParser = require('cookie-parser');
app.use(cookieParser());

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

// Trust proxy to handle X-Forwarded-* headers from ALB
app.set('trust proxy', true);

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://main.dfhc5lowsfl4h.amplifyapp.com",
    "https://shopspher.com",
    "https://api.shopspher.com",
    "https://www.shopspher.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('/', cors(corsOptions));

// Security middleware for HTTPS behind ALB
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // If behind ALB, check if request was originally HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    next();
  } else {
    // Redirect to HTTPS if needed
    res.redirect('https://' + req.headers.host + req.url);
  }
});


// Create HTTP server (no HTTPS needed since ALB handles SSL)
const server = http.createServer(app);

// Socket.io configuration with proper WebSocket handling for ALB
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://main.dfhc5lowsfl4h.amplifyapp.com",
      "https://shopspher.com",
      "https://api.shopspher.com"
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // Ensure WebSocket transport works through ALB
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('join_chat', async (data) => {
    const { roomId, sellerId, userId, userType, userName } = data;
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    try {
      const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
      socket.emit('previous_messages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }

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
dbconnect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api", productRouter);
app.use("/api", adminRoute);
app.use("/api", sellerRoute);
app.use("/upload", express.static("upload"));
app.use("/auth", authRoute);
app.use("/api", paymentRoute);
app.use("/api/orders", OrderRoute);
app.use("/api", chatRoute);
app.use("/api", sellertextRoute);
app.use("/api", postpaymentRoute);
app.use("/api", shippingRoute);
app.use("/api", orderPaymentRoute);

// Health check endpoint for ALB
 app.get('/health', (req, res) => {
   res.status(200).json({ 
     status: 'healthy', 
     timestamp: new Date(),
     server: 'ShopSpher Backend'
   });
 });

// // Root endpoint
  app.all('/', (req, res) => {
    res.json({ 
      message: 'ShopSpher API Server', 
     version: '1.0',
      endpoints: {
        health: '/health',
        api: '/api',
        auth: '/auth'
      }
    });
  })

// Root endpoint
// Add this debug code temporarily to see the actual path
app.all('/', (req, res) => {
  if (req.accepts("html")) {
    const filePath = '/var/www/Shopshere/shopbackend/views/index.html'; // ← ABSOLUTE PATH
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.json({ 
          message: 'ShopSpher API Server', 
          version: '1.0',
          status: 'online'
        });
      }
    });
  } else if (req.accepts("json")) {
    res.json({ 
      message: 'ShopSpher API Server', 
      version: '1.0',
      status: 'online'
    });
  } else {
    res.type("text").send("ShopSpher API Server - use JSON or HTML");
  }
});
// Add this debug code to see what __dirname actually is
console.log('Current __dirname:', __dirname);

app.all('/', (req, res) => {
  if (req.accepts("html")) {
    const filePath = path.join(__dirname, "views", "index.html");
    console.log('Looking for file at:', filePath); // ← DEBUG
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.json({ 
          message: 'ShopSpher API Server', 
          version: '1.0',
          status: 'online'
        });
      }
    });
  } else if (req.accepts("json")) {
    res.json({ 
      message: 'ShopSpher API Server', 
      version: '1.0',
      status: 'online'
    });
  } else {
    res.type("text").send("ShopSpher API Server - use JSON or HTML");
  }
});

app.use(morgan("dev"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

mongoose.connection.once("open", () => {
  console.log("Database connected");
  
  // Start main server only
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Main server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});