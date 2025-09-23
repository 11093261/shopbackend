const express = require("express");
const path = require("path");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config()
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3200;
const app = express()

const dbconnect = require("./config/dbconnnect");
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

// Health check endpoint - MOVE THIS TO THE TOP for load balancer access
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'ShopSpher Backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0'
  };

  // Always return 200 status for health checks
  // Load balancers just need to know the server is responsive
  res.status(200).json(healthCheck);
});

// Simple health check for load balancers that don't need JSON
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ready', (req, res) => {
  // Check if database is connected
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ 
      status: 'ready', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({ 
      status: 'not ready', 
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Security headers and HTTPS redirect
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Fixed HTTPS redirect - redirect HTTP to HTTPS
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

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
app.use(cors(corsOptions));
app.options('/', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('/var/www/Shopshere'));
app.use("/upload", express.static("upload"));

// Routes
app.use("/auth", authRoute);
app.use("/api", productRouter);
app.use("/api", adminRoute);
app.use("/api", sellerRoute);
app.use("/api", paymentRoute);
app.use("/api/orders", OrderRoute);
app.use("/api", chatRoute);
app.use("/api", sellertextRoute);
app.use("/api", postpaymentRoute);
app.use("/api", shippingRoute);
app.use("/api", orderPaymentRoute);

// SINGLE root route handler (removed duplicates)
app.all('/', (req, res) => {
  if (req.accepts("html")) {
    const filePath = path.join(__dirname, "views", "index.html");
    console.log('Looking for file at:', filePath);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        // Fallback to JSON response
        res.json({ 
          message: 'ShopSpher API Server', 
          version: '1.0',
          status: 'online',
          note: 'Index.html not found, serving JSON instead'
        });
      }
    });
  } else if (req.accepts("json")) {
    res.json({ 
      message: 'ShopSpher API Server', 
      version: '1.0',
      status: 'online',
      endpoints: {
        health: '/health',
        healthz: '/healthz',
        ready: '/ready',
        api: '/api',
        auth: '/auth',
        uploads: '/upload'
      }
    });
  } else {
    res.type("text").send("ShopSpher API Server - use JSON or HTML");
  }
});

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://main.dfhc5lowsfl4h.amplifyapp.com",
      "https://shopspher.com",
      "https://www.shopspher.com",
      "https://api.shopspher.com",
      "https://shopfrontend-lake.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Socket.IO event handlers with error handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_chat', async (data) => {
    const { roomId, sellerId, userId, userType, userName } = data;
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    
    try {
      const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
      socket.emit('previous_messages', messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      socket.emit('error', { message: 'Failed to load previous messages' });
    }

    if (userType === 'seller') {
      try {
        const conversations = await Conversation.find({ sellerId }).sort({ timestamp: -1 });
        socket.emit('previous_conversations', conversations);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        socket.emit('error', { message: 'Failed to load conversations' });
      }
    }
  });

  socket.on('send_message', async (data) => {
    const { roomId, sellerId, userId, message, sender, senderName } = data;
    
    try {
      const newMessage = new Message({
        roomId,
        sellerId,
        userId,
        message,
        sender,
        senderName,
        timestamp: new Date()
      });

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
      
      // Emit to room
      io.to(roomId).emit('message_received', newMessage);
      
      // Notify seller if message is from buyer
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
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Error handling for socket
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware (should be after routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ... your routes here ...

// 404 Handler - SIMPLE AND SAFE
app.use((req, res) => {
  // This will only catch requests that didn't match any previous routes
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: 'Check /health for server status'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Database connection and server startup
dbconnect();

mongoose.connection.once("open", () => {
  console.log("Database connected successfully");
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    console.log(`🔍 Simple health check at: http://localhost:${PORT}/healthz`);
    console.log(`📊 Readiness check at: http://localhost:${PORT}/ready`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Main server closed');
    mongoose.connection.close(false, () => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});