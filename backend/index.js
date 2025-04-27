import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import productRouter from "./routes/product.route.js";
import orderRouter from "./routes/order.route.js";
import cartRouter from "./routes/cart.route.js";
import messageRouter from "./routes/message.route.js";
import paymentRouter from "./routes/payment.route.js";
import { notifyAdminOfLowStock } from "./utils/lowStockNotifier.js";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

// Enhanced ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express app
const app = express();

// Enhanced security middleware
app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dynamic CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_PROD_URL, process.env.FRONTEND_DEV_URL]
    : process.env.FRONTEND_DEV_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Connect to MongoDB with enhanced error handling
connectDB().catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Create HTTP server with keep-alive settings
const server = http.createServer(app);
server.keepAliveTimeout = 60000; // 60 seconds
server.headersTimeout = 65000; // 65 seconds

// Enhanced Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  transports: ["websocket", "polling"],
  allowEIO3: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  // Production optimizations
  serveClient: process.env.NODE_ENV !== 'production',
  path:'/socket.io'
});

// Socket.IO enhanced connection handling
io.on("connection", (socket) => {
  console.log(`⚡ New connection ${socket.id}`);

  socket.on("error", (err) => {
    console.error(`Socket error (${socket.id})`, err);
  });

  socket.on("disconnect", (reason) => {
    console.log(`🚫 Client disconnected (${socket.id})`, reason);
  });

  // Add authentication middleware for sensitive events
  socket.use((event, next) => {
    if (['privateEvent'].includes(event[0]) && !socket.user) {
      return next(new Error('Unauthorized'));
    }
    next();
  });
});

export { io };

// API Routes with versioning
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/messages", messageRouter);
app.use("/api/payment-proof", paymentRouter);

// Add this after all app.use() routes
app._router.stack.forEach(layer => {
  if (layer.route) {
    const path = layer.route.path;
    if (typeof path !== 'string') {
      console.error('🚨 Non-string route path:', { 
        path, 
        methods: Object.keys(layer.route.methods) 
      });
      throw new Error('Invalid route path type');
    }
    if (path.includes(':/') || path.endsWith(':')) {
      console.error('🚨 Malformed route parameter:', path);
      throw new Error('Route contains invalid parameter syntax');
    }
  }
});

// Enhanced request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.url}`);
  next();
});

// Static files with security headers
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Production configuration for frontend
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "..", "frontend", "dist");
  console.log("🖥️ Serving production frontend from", staticPath);

  // Security headers for production
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.static(staticPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Enhanced health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memoryUsage: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Low stock notification with error handling
const lowStockInterval = setInterval(() => {
  notifyAdminOfLowStock().catch(err => {
    console.error('Low stock notification error:', err);
  });
}, 3600000);

// Centralized error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);

  res.status(statusCode).json({
    error: {
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler with JSON response
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested resource ${req.url} was not found` 
  });
});

// Server startup with cluster support
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = () => {
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.IO running on ws://${HOST}:${PORT}`);
    console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Cluster mode for production
if (process.env.NODE_ENV === 'production' && process.env.USE_CLUSTER === 'true') {
  import('cluster').then(cluster => {
    if (cluster.default.isPrimary) {
      console.log(`Primary ${process.pid} is running`);
      
      // Fork workers
      for (let i = 0; i < os.cpus().length; i++) {
        cluster.default.fork();
      }
      
      cluster.default.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.default.fork();
      });
    } else {
      startServer();
    }
  });
} else {
  startServer();
}

// Graceful shutdown with cleanup
const shutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  
  clearInterval(lowStockInterval);
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown if server doesn't close in time
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown();
});