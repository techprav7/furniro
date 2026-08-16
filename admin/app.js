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

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

// ─── Load Backend Mongoose Models (CommonJS) ────────────────────────────────
let Product, Order, User, Payment, Contact, Category, Coupon, Banner, Setting;
try {
  Product = require("../backend/models/Product.js");
  Order = require("../backend/models/Order.js");
  User = require("../backend/models/User.js");
  Payment = require("../backend/models/Payment.js");
  Contact = require("../backend/models/Contact.js");
  Category = require("../backend/models/Category.js");
  Coupon = require("../backend/models/Coupon.js");
  Banner = require("../backend/models/Banner.js");
  Setting = require("../backend/models/Setting.js");
} catch (err) {
  console.error("\n❌ DEPLOYMENT ERROR: Failed to load backend models in the Admin panel!");
  console.error("Original Error:", err.message);
  process.exit(1);
}

// ─── Load Email Service ─────────────────────────────────────────────────────
let sendOrderStatusNotification = async () => {};
try {
  const emailService = require("../backend/utils/emailService.js");
  sendOrderStatusNotification = emailService.sendOrderStatusNotification;
} catch (err) {
  console.warn("⚠️ Warning: emailService could not be loaded in admin:", err.message);
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
    const totalCoupons = await Coupon.countDocuments({ isActive: true });
    const totalBanners = await Banner.countDocuments({ isActive: true });

    // Sum of paid/shipped/delivered/dispatched/out_for_delivery orders
    const salesResult = await Order.aggregate([
      { $match: { status: { $in: ["paid", "dispatched", "shipped", "out_for_delivery", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // Low stock products count (stock <= 5)
    const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });

    // Status breakdown
    const statusCountsAgg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const statusCounts = {};
    statusCountsAgg.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    // Top 5 Best-Selling Products from Orders
    const topProductsAgg = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // Last 7 days revenue timeline
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const timelineAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ["paid", "dispatched", "shipped", "out_for_delivery", "delivered"] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build complete 7-day array
    const revenueTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const match = timelineAgg.find(t => t._id === dateStr);
      revenueTimeline.push({
        date: dateStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: match ? match.revenue : 0,
        orders: match ? match.count : 0
      });
    }

    // Recent 5 Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("razorpayOrderId totalAmount status shippingAddress createdAt")
      .lean();

    return {
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalContacts,
        totalSales,
        lowStockCount,
        totalCoupons,
        totalBanners,
        statusCounts,
        topProducts: topProductsAgg,
        revenueTimeline,
        recentOrders
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

// ─── Connect to MongoDB & Initialize AdminJS ────────────────────────────────
const startAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Admin panel connected to MongoDB");

    // Initialize Site Settings document if not already present
    const existingSetting = await Setting.findOne();
    if (!existingSetting) {
      await Setting.create({
        storeName: "Furniro",
        storeEmail: "support@furniro.com",
        storePhone: "+91 98765 43210",
        currencyCode: "INR",
        currencySymbol: "₹",
        taxPercentage: 18,
        freeShippingThreshold: 50000
      });
      console.log("⚙️ Default Site Settings initialized");
    }
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // ─── AdminJS Configuration ──────────────────────────────────────────────
  const admin = new AdminJS({
    resources: [
      // ── Categories ───────────────────────────────────────────────────
      {
        resource: Category,
        options: {
          navigation: { name: "Shop", icon: "Folder" },
          sort: { sortBy: "displayOrder", direction: "asc" },
          listProperties: ["name", "slug", "parentCategory", "displayOrder", "isActive", "isFeatured"],
          editProperties: [
            "name", "slug", "description", "parentCategory", "imageFile",
            "bannerFile", "displayOrder", "isActive", "isFeatured"
          ],
          showProperties: [
            "name", "slug", "description", "parentCategory", "image",
            "banner", "displayOrder", "isActive", "isFeatured", "createdAt", "updatedAt"
          ],
          properties: {
            image: { isRequired: false },
            imageFile: { label: "Category Thumbnail File", isRequired: false },
            banner: { isRequired: false },
            bannerFile: { label: "Category Banner File", isRequired: false },
            description: { type: "textarea" },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: new BackendUploadProvider(),
            uploadPath: (record, filename) => {
              const ext = path.extname(filename);
              const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
              return `furnio/categories/${record.id() || "new"}_${Date.now()}_${base}${ext}`;
            },
            properties: {
              key: "image",
              file: "imageFile",
            },
            validation: {
              mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"],
            },
          }),
          uploadFeature({
            componentLoader,
            provider: new BackendUploadProvider(),
            uploadPath: (record, filename) => {
              const ext = path.extname(filename);
              const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
              return `furnio/categories/banners/${record.id() || "new"}_${Date.now()}_${base}${ext}`;
            },
            properties: {
              key: "banner",
              file: "bannerFile",
            },
            validation: {
              mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
            },
          }),
        ],
      },

      // ── Products ──────────────────────────────────────────────────────
      {
        resource: Product,
        options: {
          navigation: { name: "Shop", icon: "ShoppingCart" },
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["name", "price", "category", "stock", "isFeatured", "rating", "sku"],
          editProperties: [
            "name", "slug", "sku", "price", "originalPrice", "discount",
            "category", "subCategory", "parentCategory", "description",
            "imageFile", "images", "stock", "material", "weight", "weightUnit",
            "dimensions", "variants", "sizes", "colors", "tags",
            "isFeatured", "isNewArrival", "autoHideWhenOutOfStock", "allowBackorder",
            "seoTitle", "seoDescription", "seoKeywords",
          ],
          showProperties: [
            "name", "slug", "sku", "price", "originalPrice", "discount",
            "category", "subCategory", "parentCategory", "description",
            "image", "images", "stock", "material", "weight", "weightUnit",
            "dimensions", "variants", "sizes", "colors", "tags",
            "isFeatured", "isNewArrival", "autoHideWhenOutOfStock", "allowBackorder",
            "seoTitle", "seoDescription", "seoKeywords",
            "reviews", "rating", "reviewCount", "createdAt", "updatedAt",
          ],
          properties: {
            image: { isRequired: false },
            imageFile: { label: "Product Primary Image", isRequired: false },
            description: { type: "textarea" },
            images: { type: "mixed", isArray: true },
            variants: { type: "mixed" },
            dimensions: { type: "mixed" },
            tags: { type: "mixed", isArray: true },
            seoKeywords: { type: "mixed", isArray: true },
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
          actions: {
            // 📑 Clone Product Action
            cloneProduct: {
              actionType: "record",
              component: false,
              icon: "Copy",
              label: "Duplicate Listing",
              guard: "Are you sure you want to clone this product listing?",
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const productId = record.id();
                const original = await Product.findById(productId).lean();
                if (!original) throw new Error("Product not found");

                delete original._id;
                delete original.__v;
                delete original.createdAt;
                delete original.updatedAt;

                const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                original.name = `${original.name} (Copy)`;
                original.sku = `${original.sku || "SKU"}-${suffix}`;
                original.slug = `${original.slug || "product"}-copy-${suffix.toLowerCase()}`;
                original.isFeatured = false;
                original.isNewArrival = false;

                const cloned = await Product.create(original);

                return {
                  record: record.toJSON(currentAdmin),
                  notice: {
                    message: `Product "${original.name}" successfully duplicated (SKU: ${original.sku})!`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: cloned._id.toString(), actionName: "edit" })
                };
              }
            },

            // ⚡ Bulk 10% Discount Action
            bulkApplyDiscount: {
              actionType: "bulk",
              icon: "Percent",
              label: "Apply 10% Discount",
              guard: "Apply a 10% discount to all selected products?",
              handler: async (request, response, context) => {
                const { records } = context;
                let count = 0;
                for (const record of records) {
                  const p = await Product.findById(record.id());
                  if (p) {
                    if (!p.originalPrice || p.originalPrice <= p.price) {
                      p.originalPrice = p.price;
                    }
                    p.discount = 10;
                    p.price = Math.round(p.originalPrice * 0.9);
                    await p.save();
                    count++;
                  }
                }
                return {
                  records: records.map(r => r.toJSON(context.currentAdmin)),
                  notice: {
                    message: `Applied 10% discount to ${count} selected products.`,
                    type: "success"
                  }
                };
              }
            },

            // ⭐ Bulk Toggle Featured
            bulkToggleFeatured: {
              actionType: "bulk",
              icon: "Star",
              label: "Toggle Featured",
              guard: "Toggle the featured flag on all selected products?",
              handler: async (request, response, context) => {
                const { records } = context;
                let count = 0;
                for (const record of records) {
                  const p = await Product.findById(record.id());
                  if (p) {
                    p.isFeatured = !p.isFeatured;
                    await p.save();
                    count++;
                  }
                }
                return {
                  records: records.map(r => r.toJSON(context.currentAdmin)),
                  notice: {
                    message: `Updated featured status for ${count} products.`,
                    type: "success"
                  }
                };
              }
            }
          }
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
            // 📝 Hook: Send email on manual record edit (if status changed)
            edit: {
              after: async (response, request, context) => {
                try {
                  const record = response.record;
                  const orderId = record?.params?._id || record?.params?.id || (typeof record?.id === "function" ? record.id() : record?.id) || context.record?.id();
                  if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order) {
                      await sendOrderStatusNotification(order).catch(err => console.error("Email notification error on edit:", err));
                    }
                  }
                } catch (e) {
                  console.error("Order edit after-hook error:", e);
                }
                return response;
              }
            },

            // 📥 Export Orders to CSV Action
            exportOrdersCsv: {
              actionType: "resource",
              icon: "Download",
              label: "Export Orders (CSV)",
              handler: async (request, response, context) => {
                return {
                  redirectUrl: "/admin/export/orders.csv"
                };
              }
            },

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

                // Send cancellation email notification
                await sendOrderStatusNotification(order).catch(err => console.error("Cancel email error:", err));

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
                    message: `Order #${order.razorpayOrderId} cancelled, stock restored, and customer notified.`,
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

                // Send refund confirmation email
                await sendOrderStatusNotification(order).catch(err => console.error("Refund email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Refund of ₹${order.totalAmount} issued for Order #${order.razorpayOrderId} and customer notified.`,
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

                // Send replacement confirmation email
                await sendOrderStatusNotification(order).catch(err => console.error("Replace email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Replaced and customer notified.`,
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

                // Send dispatch notification email
                await sendOrderStatusNotification(order).catch(err => console.error("Dispatch email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Dispatched and customer notified!`,
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

                // Send shipping & tracking notification email
                await sendOrderStatusNotification(order).catch(err => console.error("Shipped email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Shipped and tracking email sent!`,
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

                // Send Out for Delivery email
                await sendOrderStatusNotification(order).catch(err => console.error("Out for delivery email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Out for Delivery and customer notified!`,
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

                // Send Delivery confirmation email
                await sendOrderStatusNotification(order).catch(err => console.error("Delivered email error:", err));

                const updatedRecord = await resource.findOne(orderId);
                return {
                  record: updatedRecord.toJSON(currentAdmin),
                  notice: {
                    message: `Order #${order.razorpayOrderId} marked as Delivered and confirmation email sent!`,
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

                // Send return confirmation email
                await sendOrderStatusNotification(order).catch(err => console.error("Return email error:", err));

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
                    message: `Order #${order.razorpayOrderId} marked as Returned, stock restored, and customer notified.`,
                    type: "success"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: orderId, actionName: "show" })
                };
              }
            },
          },
        },
      },

      // ── Coupons & Discounts ───────────────────────────────────────────
      {
        resource: Coupon,
        options: {
          navigation: { name: "Sales", icon: "Tag" },
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["code", "discountType", "discountValue", "minOrderAmount", "usageLimit", "usageCount", "isActive", "endDate"],
          editProperties: [
            "code", "description", "discountType", "discountValue",
            "minOrderAmount", "maxDiscountAmount", "startDate", "endDate",
            "usageLimit", "isActive"
          ],
          showProperties: [
            "code", "description", "discountType", "discountValue",
            "minOrderAmount", "maxDiscountAmount", "startDate", "endDate",
            "usageLimit", "usageCount", "isActive", "createdAt", "updatedAt"
          ],
          properties: {
            description: { type: "textarea" },
            discountType: {
              availableValues: [
                { value: "percentage", label: "Percentage (%)" },
                { value: "flat", label: "Flat Amount (₹)" },
              ],
            },
          },
        },
      },

      // ── Users / Customers ─────────────────────────────────────────────
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
          actions: {
            // 🛍️ Customer Order History Action
            viewOrderHistory: {
              actionType: "record",
              component: false,
              icon: "ShoppingBag",
              label: "Order History",
              handler: async (request, response, context) => {
                const { record, resource, currentAdmin } = context;
                const user = await User.findById(record.id()).lean();
                if (!user) throw new Error("User not found");

                const orders = await Order.find({
                  $or: [
                    { clerkUserId: user.clerkId },
                    { "shippingAddress.email": user.email }
                  ]
                }).sort({ createdAt: -1 }).lean();

                const summary = orders.length > 0
                  ? orders.map(o => `Order #${o.razorpayOrderId || o._id}: ₹${o.totalAmount} (${o.status})`).join(" | ")
                  : "No orders placed yet.";

                return {
                  record: record.toJSON(currentAdmin),
                  notice: {
                    message: `Customer ${user.name} has ${orders.length} order(s): ${summary}`,
                    type: "info"
                  },
                  redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: record.id(), actionName: "show" })
                };
              }
            }
          }
        },
      },

      // ── Payments ──────────────────────────────────────────────────────
      {
        resource: Payment,
        options: {
          navigation: { name: "Sales", icon: "CreditCard" },
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["razorpayOrderId", "amount", "currency", "status", "method", "createdAt"],
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

      // ── Banners & Content ─────────────────────────────────────────────
      {
        resource: Banner,
        options: {
          navigation: { name: "Content", icon: "Image" },
          sort: { sortBy: "displayOrder", direction: "asc" },
          listProperties: ["title", "position", "displayOrder", "isActive", "buttonText", "linkUrl"],
          editProperties: [
            "title", "subtitle", "imageFile", "mobileImage", "linkUrl",
            "buttonText", "position", "displayOrder", "isActive", "startDate", "endDate"
          ],
          showProperties: [
            "title", "subtitle", "image", "mobileImage", "linkUrl",
            "buttonText", "position", "displayOrder", "isActive", "startDate", "endDate",
            "createdAt", "updatedAt"
          ],
          properties: {
            image: { isRequired: false },
            imageFile: { label: "Banner Image File", isRequired: false },
            position: {
              availableValues: [
                { value: "hero", label: "Hero Slider (Top Banner)" },
                { value: "featured_collection", label: "Featured Collection" },
                { value: "middle_banner", label: "Middle Promo Banner" },
                { value: "popup", label: "Promotional Popup" },
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
              return `furnio/banners/${record.id() || "new"}_${Date.now()}_${base}${ext}`;
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

      // ── Contacts ──────────────────────────────────────────────────────
      {
        resource: Contact,
        options: {
          navigation: { name: "People", icon: "Mail" },
          sort: { sortBy: "createdAt", direction: "desc" },
          listProperties: ["name", "email", "subject", "createdAt"],
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
          },
          showProperties: ["name", "email", "subject", "message", "createdAt"],
        },
      },

      // ── Site Settings ─────────────────────────────────────────────────
      {
        resource: Setting,
        options: {
          navigation: { name: "Settings", icon: "Settings" },
          listProperties: ["storeName", "storeEmail", "storePhone", "gstin", "taxPercentage", "freeShippingThreshold"],
          editProperties: [
            "storeName", "storeEmail", "storePhone", "storeAddress", "businessHours",
            "gstin", "taxPercentage", "freeShippingThreshold", "currencyCode", "currencySymbol",
            "socialInstagram", "socialFacebook", "socialTwitter", "socialPinterest",
            "returnPolicy", "privacyPolicy", "termsOfService", "shippingPolicy"
          ],
          showProperties: [
            "storeName", "storeEmail", "storePhone", "storeAddress", "businessHours",
            "gstin", "taxPercentage", "freeShippingThreshold", "currencyCode", "currencySymbol",
            "socialInstagram", "socialFacebook", "socialTwitter", "socialPinterest",
            "returnPolicy", "privacyPolicy", "termsOfService", "shippingPolicy",
            "updatedAt"
          ],
          properties: {
            storeAddress: { type: "textarea" },
            businessHours: { type: "textarea" },
            returnPolicy: { type: "textarea" },
            privacyPolicy: { type: "textarea" },
            termsOfService: { type: "textarea" },
            shippingPolicy: { type: "textarea" },
          },
          actions: {
            delete: { isAccessible: false },
            new: { isAccessible: false }
          }
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
          Product: "Products",
          Category: "Categories",
          Order: "Orders",
          User: "Customers",
          Payment: "Payments",
          Contact: "Inquiries",
          Coupon: "Coupons & Discounts",
          Banner: "Banners & Content",
          Setting: "Store Settings",
          Shop: "Catalog",
          Sales: "Sales & Orders",
          People: "Customer Support",
          Content: "Marketing",
          Settings: "Store Config",
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
          cloneProduct: "Duplicate Listing",
          exportOrdersCsv: "Export to CSV",
          bulkApplyDiscount: "Bulk 10% Discount",
          bulkToggleFeatured: "Toggle Featured",
          viewOrderHistory: "Order History",
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
          return { email, title: "Administrator" };
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

  // 📥 Endpoint for CSV Orders Export
  app.get("/admin/export/orders.csv", async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      const headers = [
        "Order ID", "Date", "Customer Name", "Email", "Phone", "Street",
        "City", "State", "Pincode", "Total Amount (INR)", "Status",
        "Tracking Number", "Courier Partner", "Razorpay Payment ID", "Items Summary"
      ];

      const rows = orders.map(order => {
        const itemsSummary = (order.items || [])
          .map(i => `${i.name} (x${i.quantity}) - ₹${i.price}`)
          .join(" | ");
        const addr = order.shippingAddress || {};
        const customerName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || order.clerkUserId;

        return [
          `"${order.razorpayOrderId || order._id}"`,
          `"${order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : ""}"`,
          `"${customerName.replace(/"/g, '""')}"`,
          `"${(addr.email || "").replace(/"/g, '""')}"`,
          `"${(addr.phone || "").replace(/"/g, '""')}"`,
          `"${(addr.streetAddress || "").replace(/"/g, '""')}"`,
          `"${(addr.townCity || "").replace(/"/g, '""')}"`,
          `"${(addr.province || "").replace(/"/g, '""')}"`,
          `"${(addr.zipCode || "").replace(/"/g, '""')}"`,
          order.totalAmount || 0,
          `"${order.status || ""}"`,
          `"${(order.trackingNumber || "").replace(/"/g, '""')}"`,
          `"${(order.courierPartner || "").replace(/"/g, '""')}"`,
          `"${(order.razorpayPaymentId || "").replace(/"/g, '""')}"`,
          `"${itemsSummary.replace(/"/g, '""')}"`
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="furniro_orders_${Date.now()}.csv"`);
      return res.status(200).send(csvContent);
    } catch (err) {
      return res.status(500).send("Error generating CSV: " + err.message);
    }
  });
  
  // Redirect root requests to the AdminJS dashboard path (/admin)
  app.get("/", (req, res) => {
    res.redirect(admin.options.rootPath);
  });

  app.use(admin.options.rootPath, adminRouter);

  const PORT = process.env.PORT || process.env.ADMIN_PORT || 3002;
  app.listen(PORT, () => {
    console.log(`✅ Furniro Admin Panel is running at http://localhost:${PORT}${admin.options.rootPath}`);
  });
};

startAdmin();
