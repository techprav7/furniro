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

// CORS — only allow requests from frontend
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
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
const blogRoutes = require("./routes/blogs");
const userRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");

app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blogs", blogRoutes);
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
