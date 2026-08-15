import AdminJS, { ComponentLoader } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import express from "express";
import session from "express-session";
import ConnectMongo from "connect-mongo";
import dotenv from "dotenv";
import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import uploadFeature from "@adminjs/upload";
import { BackendUploadProvider } from "./BackendUploadProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use createRequire to load CommonJS models from the backend
const require = createRequire(import.meta.url);

// Use the exact mongoose instance from backend node_modules to avoid separate connection pool/instances
let mongoose;
try {
  mongoose = require("../backend/node_modules/mongoose");
} catch (e) {
  try {
    mongoose = require("mongoose");
    console.warn("⚠️ Warning: Could not load mongoose from '../backend/node_modules/mongoose'. Falling back to local admin mongoose.");
  } catch (err) {
    console.error("❌ ERROR: Mongoose could not be loaded. Please ensure it is installed.");
    process.exit(1);
  }
}

dotenv.config();

// ─── Load Backend Mongoose Models (CommonJS) ────────────────────────────────
let Product, Order, Blog, User, Payment, Contact;
try {
  Product = require("../backend/models/Product.js");
  Order = require("../backend/models/Order.js");
  Blog = require("../backend/models/Blog.js");
  User = require("../backend/models/User.js");
  Payment = require("../backend/models/Payment.js");
  Contact = require("../backend/models/Contact.js");
} catch (err) {
  console.error("\n❌ DEPLOYMENT ERROR: Failed to load backend models in the Admin panel!");
  console.error("This usually happens when the backend directory is missing or not packaged in your Admin panel deployment.");
  console.error("👉 FIX: If deploying on Render, ensure the 'Root Directory' is left EMPTY (not 'admin') so the backend folder is accessible.");
  console.error("👉 BUILD: Set the Build Command to 'npm run install:all' and the Start Command to 'npm run admin'.\n");
  console.error("Original Error:", err.message);
  process.exit(1);
}

// ─── Register AdminJS Mongoose Adapter ──────────────────────────────────────
AdminJS.registerAdapter(AdminJSMongoose);

// ─── Component Loader and Custom Dashboard ──────────────────────────────────
const componentLoader = new ComponentLoader();
const Components = {
  Dashboard: componentLoader.add("Dashboard", path.join(__dirname, "components/dashboard.jsx")),
};


// ─── Dashboard Stats Handler ────────────────────────────────────────────────
const dashboardHandler = async (request, response, context) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();

    // Sum of paid/shipped/delivered orders
    const salesResult = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    return {
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalContacts,
        totalSales
      }
    };
  } catch (error) {
    console.error("Dashboard handler error:", error);
    return { error: error.message };
  }
};

// ─── Validate Environment Variables ─────────────────────────────────────────
const requiredEnvVars = ["MONGODB_URI", "ADMIN_EMAIL", "ADMIN_PASSWORD", "COOKIE_SECRET", "SESSION_SECRET"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.error("❌ ERROR: Missing required environment variables in admin/.env:");
  missingEnvVars.forEach((v) => console.error(`   - ${v}`));
  console.error("\nPlease copy admin/.env.example to admin/.env and populate the required keys.\n");
  process.exit(1);
}

// ─── Connect to MongoDB ─────────────────────────────────────────────────────
const startAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Admin panel connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // ─── AdminJS Configuration ──────────────────────────────────────────────
  const admin = new AdminJS({
    resources: [
      // ── Products ──────────────────────────────────────────────────────
      {
        resource: Product,
        options: {
          navigation: { name: "Shop", icon: "ShoppingCart" },
          listProperties: ["name", "price", "category", "stock", "isFeatured", "rating", "sku"],
          editProperties: [
            "name", "description", "price", "originalPrice", "discount",
            "category", "imageFile", "images", "stock", "sizes", "colors",
            "tags", "sku", "isFeatured", "isNewArrival",
          ],
          showProperties: [
            "name", "description", "price", "originalPrice", "discount",
            "category", "image", "images", "stock", "sizes", "colors",
            "reviews", "rating", "reviewCount", "tags", "sku",
            "isFeatured", "isNewArrival", "createdAt", "updatedAt",
          ],
          properties: {
            image: {
              isRequired: false,
            },
            imageFile: {
              label: "Product Image File",
              isRequired: true,
            },
            description: { type: "textarea" },
            images: { type: "mixed", isArray: true },
            tags: { type: "mixed", isArray: true },
            category: {
              availableValues: [
                { value: "Living Room", label: "Living Room" },
                { value: "Bedroom", label: "Bedroom" },
                { value: "Dining", label: "Dining" },
                { value: "Office", label: "Office" },
                { value: "Outdoor", label: "Outdoor" },
              ],
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: new BackendUploadProvider(),
            uploadPath: (record, filename) => {
              const ext = path.extname(filename);
              const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
              return `furnio/products/${record.id() || "new"}_${Date.now()}_${base}${ext}`;
            },
            properties: {
              key: "image",
              file: "imageFile",
            },
            validation: {
              mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
            },
          }),
        ],
      },

      // ── Orders ────────────────────────────────────────────────────────
      {
        resource: Order,
        options: {
          navigation: { name: "Sales", icon: "Receipt" },
          listProperties: ["razorpayOrderId", "clerkUserId", "totalAmount", "status", "createdAt"],
          editProperties: ["status", "cancellationReason", "returnReason", "exchangeReason"],
          showProperties: [
            "razorpayOrderId", "clerkUserId", "items", "totalAmount",
            "razorpayPaymentId", "razorpaySignature", "status",
            "cancellationReason", "returnReason", "exchangeReason",
            "shippingAddress", "createdAt", "updatedAt",
          ],
          properties: {
            status: {
              availableValues: [
                { value: "pending", label: "Pending" },
                { value: "paid", label: "Paid" },
                { value: "failed", label: "Failed" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
                { value: "return_requested", label: "Return Requested" },
                { value: "exchange_requested", label: "Exchange Requested" },
              ],
            },
            shippingAddress: { type: "mixed" },
            items: { type: "mixed" },
          },
        },
      },

      // ── Blogs ─────────────────────────────────────────────────────────
      {
        resource: Blog,
        options: {
          navigation: { name: "Content", icon: "FileText" },
          listProperties: ["title", "category", "author", "isPublished", "createdAt"],
          editProperties: [
            "title", "excerpt", "content", "imageFile", "category",
            "author", "tags", "isPublished",
          ],
          showProperties: [
            "title", "excerpt", "content", "image", "category",
            "author", "tags", "isPublished", "createdAt", "updatedAt",
          ],
          properties: {
            image: {
              isRequired: false,
            },
            imageFile: {
              label: "Blog Image File",
              isRequired: true,
            },
            content: { type: "textarea" },
            excerpt: { type: "textarea" },
            tags: { type: "mixed", isArray: true },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: new BackendUploadProvider(),
            uploadPath: (record, filename) => {
              const ext = path.extname(filename);
              const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
              return `furnio/blogs/${record.id() || "new"}_${Date.now()}_${base}${ext}`;
            },
            properties: {
              key: "image",
              file: "imageFile",
            },
            validation: {
              mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
            },
          }),
        ],
      },

      // ── Users ─────────────────────────────────────────────────────────
      {
        resource: User,
        options: {
          navigation: { name: "People", icon: "User" },
          listProperties: ["name", "email", "clerkId", "createdAt"],
          editProperties: ["name", "email", "profileImageUrl", "defaultAddress", "defaultBillingAddress"],
          showProperties: [
            "name", "email", "clerkId", "profileImageUrl",
            "defaultAddress", "defaultBillingAddress",
            "createdAt", "updatedAt",
          ],
        },
      },

      // ── Payments ──────────────────────────────────────────────────────
      {
        resource: Payment,
        options: {
          navigation: { name: "Sales", icon: "CreditCard" },
          listProperties: ["razorpayOrderId", "amount", "currency", "status", "method", "createdAt"],
          // Payments are read-only for auditing
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
            delete: { isAccessible: false },
          },
          showProperties: [
            "clerkUserId", "orderId", "razorpayOrderId", "razorpayPaymentId",
            "razorpaySignature", "amount", "currency", "status", "method",
            "cardLast4", "bank", "wallet", "vpa", "email", "contact",
            "description", "errorCode", "errorDescription",
            "refundId", "refundAmount", "createdAt", "updatedAt",
          ],
        },
      },

      // ── Contacts ──────────────────────────────────────────────────────
      {
        resource: Contact,
        options: {
          navigation: { name: "People", icon: "Mail" },
          listProperties: ["name", "email", "subject", "createdAt"],
          // Contacts are read-only — submissions from the contact form
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
          },
          showProperties: ["name", "email", "subject", "message", "createdAt"],
        },
      },
    ],

    rootPath: "/admin",
    branding: {
      companyName: "Furniro Admin",
      logo: false,
      softwareBrothers: false,
    },
    dashboard: {
      handler: dashboardHandler,
      component: Components.Dashboard,
    },
    componentLoader,
  });

  // ─── Authentication ─────────────────────────────────────────────────────
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { email, title: "Admin" };
        }
        return null;
      },
      cookiePassword: process.env.COOKIE_SECRET,
    },
    null,
    {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: ConnectMongo.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "admin_sessions",
        ttl: 24 * 60 * 60, // 1 day
      }),
      cookie: {
        httpOnly: true,
        secure: "auto",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    }
  );

  // ─── Express App ────────────────────────────────────────────────────────
  const app = express();
  
  // Redirect root requests to the AdminJS dashboard path (/admin)
  app.get("/", (req, res) => {
    res.redirect(admin.options.rootPath);
  });

  app.use(admin.options.rootPath, adminRouter);

  const PORT = process.env.PORT || process.env.ADMIN_PORT || 3002;
  app.listen(PORT, () => {
    console.log(`✅ AdminJS panel is running at http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

startAdmin();
