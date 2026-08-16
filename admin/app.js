import AdminJS, { ComponentLoader, ViewHelpers } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";

const h = new ViewHelpers();
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
let Product, Order, User, Payment, Contact;
try {
  Product = require("../backend/models/Product.js");
  Order = require("../backend/models/Order.js");
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

    // Sum of paid/shipped/delivered/dispatched/out_for_delivery orders
    const salesResult = await Order.aggregate([
      { $match: { status: { $in: ["paid", "dispatched", "shipped", "out_for_delivery", "delivered"] } } },
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
          sort: { sortBy: "createdAt", direction: "desc" },
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
          // 🚀 Show latest orders on top (reverse chronological order)
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["razorpayOrderId", "totalAmount", "status", "clerkUserId", "createdAt"],
          editProperties: [
            "status",
            "trackingNumber",
            "courierPartner",
            "deliveryNotes",
            "cancellationReason",
            "returnReason",
            "exchangeReason"
          ],
          showProperties: [
            "razorpayOrderId",
            "status",
            "totalAmount",
            "trackingNumber",
            "courierPartner",
            "deliveryNotes",
            "refundId",
            "refundAmount",
            "clerkUserId",
            "items",
            "razorpayPaymentId",
            "razorpaySignature",
            "cancellationReason",
            "returnReason",
            "exchangeReason",
            "shippingAddress",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            status: {
              availableValues: [
                { value: "pending", label: "🟡 Pending (Awaiting Payment)" },
                { value: "paid", label: "🟢 Order Placed (Paid)" },
                { value: "dispatched", label: "📦 Dispatched (Warehouse)" },
                { value: "shipped", label: "🚚 Shipped (In Transit)" },
                { value: "out_for_delivery", label: "🛵 Out for Delivery" },
                { value: "delivered", label: "✅ Delivered" },
                { value: "cancelled", label: "❌ Cancelled" },
                { value: "return_requested", label: "🔄 Return Requested" },
                { value: "returned", label: "↩️ Returned" },
                { value: "exchange_requested", label: "🔁 Replace / Exchange Requested" },
                { value: "replaced", label: "✨ Replaced" },
                { value: "refunded", label: "💰 Refunded" },
                { value: "failed", label: "⚠️ Payment Failed" },
              ],
            },
            shippingAddress: { type: "mixed" },
            items: { type: "mixed" },
            deliveryNotes: { type: "textarea" },
          },
          actions: {
            // ❌ Cancel Order Action
            cancelOrder: {
              actionType: "record",
              component: false,
              icon: "XCircle",
              label: "Cancel Order",
              guard: "Are you sure you want to cancel this order, restore stock, and process refund?",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return status && !["cancelled", "refunded"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                const originalStatus = order.status;
                order.status = "cancelled";
                order.cancellationReason = "Cancelled by Admin";
                
                // If paid, record refund
                if (["paid", "dispatched", "shipped", "out_for_delivery", "delivered"].includes(originalStatus)) {
                  const mockRefundId = `admin_rfnd_${Date.now()}`;
                  order.refundId = mockRefundId;
                  order.refundAmount = order.totalAmount;

                  await Payment.findOneAndUpdate(
                    { razorpayOrderId: order.razorpayOrderId },
                    {
                      $set: {
                        status: "refunded",
                        refundId: mockRefundId,
                        refundAmount: order.totalAmount
                      }
                    }
                  );
                }

                await order.save();

                // Restore stock for all products in order
                if (order.items && order.items.length > 0) {
                  for (const item of order.items) {
                    if (item.productId) {
                      await Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: item.quantity }
                      });
                    }
                  }
                }

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} cancelled, stock restored, and refund processed.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // 💰 Issue Refund Action
            refundOrder: {
              actionType: "record",
              component: false,
              icon: "DollarSign",
              label: "Issue Refund",
              guard: "Are you sure you want to issue a refund for this order?",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return status && status !== "refunded";
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                const mockRefundId = `admin_rfnd_${Date.now()}`;
                order.status = "refunded";
                order.refundId = mockRefundId;
                order.refundAmount = order.totalAmount;
                await order.save();

                await Payment.findOneAndUpdate(
                  { razorpayOrderId: order.razorpayOrderId },
                  {
                    $set: {
                      status: "refunded",
                      refundId: mockRefundId,
                      refundAmount: order.totalAmount
                    }
                  }
                );

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Refund of ₹${order.totalAmount} issued for Order #${order.razorpayOrderId}.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // 🔁 Replace Order Action
            replaceOrder: {
              actionType: "record",
              component: false,
              icon: "Repeat",
              label: "Mark Replaced",
              guard: "Confirm marking this order as replacement fulfilled?",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return status && status !== "replaced";
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "replaced";
                await order.save();

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Replaced.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // 📦 Delivery Status: Mark Dispatched
            markDispatched: {
              actionType: "record",
              component: false,
              icon: "Package",
              label: "Dispatch Order",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return ["pending", "paid"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "dispatched";
                await order.save();

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Dispatched.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // 🚚 Delivery Status: Mark Shipped
            markShipped: {
              actionType: "record",
              component: false,
              icon: "Truck",
              label: "Ship Order",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return ["pending", "paid", "dispatched"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "shipped";
                await order.save();

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Shipped.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // 🛵 Delivery Status: Out for Delivery
            markOutForDelivery: {
              actionType: "record",
              component: false,
              icon: "Navigation",
              label: "Out for Delivery",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return ["pending", "paid", "dispatched", "shipped"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "out_for_delivery";
                await order.save();

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Out for Delivery.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // ✅ Delivery Status: Mark Delivered
            markDelivered: {
              actionType: "record",
              component: false,
              icon: "CheckCircle",
              label: "Mark Delivered",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return ["pending", "paid", "dispatched", "shipped", "out_for_delivery"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "delivered";
                await order.save();

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Delivered!`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },

            // ↩️ Delivery Status: Mark Returned
            markReturned: {
              actionType: "record",
              component: false,
              icon: "CornerUpLeft",
              label: "Accept Return",
              guard: "Accept returned items and restore inventory?",
              isVisible: (context) => {
                const status = context.record?.get("status");
                return ["delivered", "return_requested"].includes(status);
              },
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const orderId = record.id();
                const order = await Order.findById(orderId);
                if (!order) throw new Error("Order not found");

                order.status = "returned";
                await order.save();

                // Restore inventory
                if (order.items && order.items.length > 0) {
                  for (const item of order.items) {
                    if (item.productId) {
                      await Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: item.quantity }
                      });
                    }
                  }
                }

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Returned and stock restored.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },
          },
        },
      },

      // ── Users ─────────────────────────────────────────────────────────
      {
        resource: User,
        options: {
          navigation: { name: "People", icon: "User" },
          sort: { sortBy: "createdAt", direction: "desc" },
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
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["razorpayOrderId", "amount", "currency", "status", "method", "createdAt"],
          // Payments are read-only for auditing, with custom refund action
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
          sort: { sortBy: "createdAt", direction: "desc" },
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
      logo: "https://res.cloudinary.com/dqtw7ofz2/image/upload/v1786774749/furnio/assets/furniro_logo.png",
      softwareBrothers: false,
    },
    locale: {
      language: "en",
      translations: {
        labels: {
          Product: "Product",
          Order: "Order",
          User: "User",
          Payment: "Payment",
          Contact: "Contact",
          Shop: "Shop",
          Sales: "Sales",
          People: "People",
        },
        actions: {
          cancelOrder: "Cancel Order",
          refundOrder: "Refund Order",
          replaceOrder: "Replace Order",
          markDispatched: "Dispatch Order",
          markShipped: "Ship Order",
          markOutForDelivery: "Out for Delivery",
          markDelivered: "Mark Delivered",
          markReturned: "Accept Return",
        },
      },
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
