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

// Configurations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.disable('x-powered-by');

// Enhanced CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://hypebeans.onrender.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Security Headers Middleware
app.use((req, res, next) => {
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://*.googleapis.com https://*.gstatic.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://www.google.com https://maps.google.com;
    connect-src 'self' ws://localhost:5000 wss://hypebeans.onrender.com;
  `.replace(/\s+/g, ' ').trim();

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io"
});

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  socket.on("order-status-changed", (data) => {
    io.emit("order-update", data);
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/messages", messageRouter);
app.use("/api/payment-proof", paymentRouter);

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Production Frontend Serving
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
