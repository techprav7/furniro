const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/config");

// Load environment variables
dotenv.config();

const app = express();

// --- Security Middleware ---

// HTTP security headers
app.use(helmet());

// CORS — allow requests from frontend and admin URLs (supports comma-separated list and trailing slashes)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, "");
      
      // Allow localhost for development
      if (cleanOrigin.startsWith("http://localhost:") || cleanOrigin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      
      // Check FRONTEND_URL environment variable
      if (process.env.FRONTEND_URL) {
        const allowedOrigins = process.env.FRONTEND_URL.split(",").map(url => url.trim().replace(/\/$/, ""));
        if (allowedOrigins.includes(cleanOrigin)) {
          return callback(null, true);
        }
      }
      
      // Reject origin cleanly by omitting CORS headers
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting — prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// --- Webhooks (Must be mounted before express.json() parser for raw body access) ---
const webhookRoutes = require("./routes/webhook");
app.use("/api/webhooks", webhookRoutes);

// --- Clerk Middleware ---
const { clerkMiddleware } = require("@clerk/express");
app.use((req, res, next) => {
  if (!process.env.CLERK_SECRET_KEY) {
    return next();
  }
  clerkMiddleware()(req, res, next);
});

// --- Parsers ---
app.use(express.json({ limit: "10kb" })); // limit body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// --- Logging ---
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// --- Database ---
connectDB();

// --- Routes ---
const productRoutes = require("./routes/products");
const contactRoutes = require("./routes/contact");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const userRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");

app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);


// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 CORS origin: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});
