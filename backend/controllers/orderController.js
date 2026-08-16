const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Payment = require("../models/Payment");

// Initialize Razorpay
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Running in mock/sandbox mode.");
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
};

// Create a new order (Initiates payment)
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Determine Clerk user ID
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
      console.warn(`⚠️ Authentication bypassed. Using fallback user: ${clerkUserId}`);
    }

    // Validate products, calculate secure total, and prepare order items
    let secureTotal = 0;
    const orderItems = [];

    for (const item of items) {
      let product = await Product.findOne({ sku: item.sku });
      if (!product && item._id) {
        try {
          product = await Product.findById(item._id);
        } catch (e) {
          // ignore casting error
        }
      }

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name || item.sku}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      secureTotal += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        sku: product.sku || `SKU-${product._id}`,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    const razorpay = getRazorpayInstance();
    let razorpayOrderId = `mock_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key_id";

    if (razorpay) {
      try {
        const options = {
          amount: secureTotal * 100,
          currency: process.env.RAZORPAY_CURRENCY || "INR",
          receipt: `receipt_rcpt_${Date.now().toString().slice(-6)}`
        };
        const rzpOrder = await razorpay.orders.create(options);
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error("❌ Razorpay order creation failed:", rzpErr);
        return res.status(500).json({ message: "Failed to initiate transaction with payment gateway" });
      }
    } else {
      console.log(`📡 Mock Razorpay Order created: ${razorpayOrderId} for amount ${secureTotal * 100}`);
    }

    // Save pending order to MongoDB
    const newOrder = new Order({
      clerkUserId,
      items: orderItems,
      totalAmount: secureTotal,
      razorpayOrderId,
      shippingAddress,
      status: "pending"
    });

    await newOrder.save();

    // Create a payment record with status "created"
    const newPayment = new Payment({
      clerkUserId,
      orderId: newOrder._id,
      razorpayOrderId,
      amount: secureTotal,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      status: "created",
      email: shippingAddress.email,
      contact: shippingAddress.phone,
      description: `Order for ${orderItems.length} item(s)`,
    });

    await newPayment.save();

    res.status(201).json({
      success: true,
      order_id: razorpayOrderId,
      key_id: keyId,
      amount: secureTotal * 100,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      orderDbId: newOrder._id
    });

  } catch (error) {
    console.error("❌ CreateOrder controller error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// Verify payment signature
exports.verifyOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: "Order ID and Payment ID are required" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    let verified = false;

    if (key_secret && razorpay_signature) {
      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");
      verified = generatedSignature === razorpay_signature;
    } else {
      console.warn("⚠️ Web signature check skipped. Auto-approving payment.");
      verified = true;
    }

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment record
    const paymentUpdate = {
      razorpayPaymentId: razorpay_payment_id,
    };
    if (razorpay_signature) {
      paymentUpdate.razorpaySignature = razorpay_signature;
    }

    // Fetch and populate payment details from Razorpay API
    const razorpay = getRazorpayInstance();
    if (razorpay) {
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentDetails) {
          paymentUpdate.method = paymentDetails.method;
          paymentUpdate.email = paymentDetails.email;
          paymentUpdate.contact = paymentDetails.contact;
          if (paymentDetails.method === "card" && paymentDetails.card) {
            paymentUpdate.cardLast4 = paymentDetails.card.last4;
          } else if (paymentDetails.method === "upi") {
            paymentUpdate.vpa = paymentDetails.vpa;
          } else if (paymentDetails.method === "netbanking") {
            paymentUpdate.bank = paymentDetails.bank;
          } else if (paymentDetails.method === "wallet") {
            paymentUpdate.wallet = paymentDetails.wallet;
          }
        }
      } catch (err) {
        console.error("❌ Failed to fetch payment details from Razorpay:", err);
      }
    } else {
      // Sandbox / mock mode payment details
      paymentUpdate.method = "card";
      paymentUpdate.cardLast4 = "4321";
      paymentUpdate.bank = "Mock Sandbox Bank";
    }

    if (!verified) {
      // Payment verification failed
      paymentUpdate.status = "failed";
      paymentUpdate.errorCode = "SIGNATURE_MISMATCH";
      paymentUpdate.errorDescription = "Payment signature verification failed";

      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { $set: paymentUpdate }
      );

      order.status = "failed";
      await order.save();

      return res.status(400).json({ success: false, message: "Payment signature mismatch/invalid verification" });
    }

    // If already paid, return success immediately
    if (order.status === "paid") {
      // Ensure payment details are captured in Payment model even if order already verified
      paymentUpdate.status = "captured";
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { $set: paymentUpdate }
      );
      return res.status(200).json({ success: true, message: "Payment already processed", order });
    }

    // Update order state
    order.status = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    if (razorpay_signature) {
      order.razorpaySignature = razorpay_signature;
    }
    await order.save();

    // Trigger order confirmation email asynchronously
    const { sendOrderConfirmationEmail } = require("../utils/emailService");
    sendOrderConfirmationEmail(order).catch(err => console.error("❌ Failed to send order confirmation email:", err));

    // Update payment record to captured
    paymentUpdate.status = "captured";
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { $set: paymentUpdate }
    );

    // Decrement stock levels for all products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
      console.log(`📉 Decrement stock for Product ID: ${item.productId} by ${item.quantity}`);
    }

    res.status(200).json({
      success: true,
      message: "Payment successfully verified",
      order
    });

  } catch (error) {
    console.error("❌ VerifyOrder controller error:", error);
    res.status(500).json({ message: "Failed to verify order payment" });
  }
};

// Fail an order (payment failed)
exports.failOrder = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const { razorpay_order_id, error_description } = req.body;

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, clerkUserId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "failed";
    await order.save();

    // Update payment record to failed
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { 
        $set: { 
          status: "failed",
          errorDescription: error_description || "Payment failed at gateway"
        } 
      }
    );

    // Trigger payment failed email notification
    const { sendOrderStatusNotification } = require("../utils/emailService");
    sendOrderStatusNotification(order).catch((err) => console.error("❌ Failed to send payment failed email:", err));

    res.json({ success: true, message: "Order marked as failed", order });
  } catch (error) {
    console.error("❌ FailOrder controller error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get order history of currently authenticated user
exports.getMyOrders = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    // Return all orders for the user (including pending/failed)
    const orders = await Order.find({ clerkUserId }).sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ GetMyOrders controller error:", error);
    res.status(500).json({ message: "Server error retrieving order history" });
  }
};

// GET /api/orders/:id — Get single order detail
exports.getOrderById = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findOne({
        _id: req.params.id,
        clerkUserId,
      }).lean();
    }

    if (!order) {
      // Try finding by razorpayOrderId
      order = await Order.findOne({
        razorpayOrderId: req.params.id,
        clerkUserId,
      }).lean();
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("GetOrderById error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/orders/:id/cancel — Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, clerkUserId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["paid", "pending"].includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel order with status "${order.status}". Only pending or paid orders can be cancelled.`
      });
    }

    const { sendOrderStatusNotification } = require("../utils/emailService");

    // Case 1: Unpaid pending order -> cancel immediately without refund
    if (order.status === "pending") {
      order.status = "cancelled";
      order.cancellationReason = reason || "Cancelled before payment";
      await order.save();

      // Restore inventory
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }

      sendOrderStatusNotification(order).catch((err) => console.error("❌ Failed to send cancel order email:", err));

      return res.json({ success: true, message: "Order cancelled successfully", order });
    }

    // Case 2: Paid order -> set to cancel_requested (Awaiting Admin Review & Refund Approval)
    order.status = "cancel_requested";
    order.cancellationReason = reason || "Customer requested order cancellation";
    await order.save();

    // Notify customer that cancellation request is received and under review
    sendOrderStatusNotification(order).catch((err) => console.error("❌ Failed to send cancel request email:", err));

    res.json({
      success: true,
      message: "Cancellation request submitted. Our team will review and approve your refund shortly.",
      order
    });
  } catch (error) {
    console.error("CancelOrder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/orders/:id/return — Request return
exports.returnOrder = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, clerkUserId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        message: `Cannot return order with status "${order.status}". Only delivered orders can be returned.`
      });
    }

    order.status = "return_requested";
    order.returnReason = reason || "Return requested by customer";
    await order.save();

    // Trigger return request email notification
    const { sendOrderStatusNotification } = require("../utils/emailService");
    sendOrderStatusNotification(order).catch((err) => console.error("❌ Failed to send return request email:", err));

    res.json({ success: true, message: "Return request submitted", order });
  } catch (error) {
    console.error("ReturnOrder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/orders/:id/exchange — Request exchange
exports.exchangeOrder = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, clerkUserId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        message: `Cannot exchange order with status "${order.status}". Only delivered orders can be exchanged.`
      });
    }

    order.status = "exchange_requested";
    order.exchangeReason = reason || "Exchange requested by customer";
    await order.save();

    // Trigger exchange request email notification
    const { sendOrderStatusNotification } = require("../utils/emailService");
    sendOrderStatusNotification(order).catch((err) => console.error("❌ Failed to send exchange request email:", err));

    res.json({ success: true, message: "Exchange request submitted", order });
  } catch (error) {
    console.error("ExchangeOrder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/orders/:id/reorder — Reorder (create new order with same items)
exports.reorder = async (req, res) => {
  try {
    let clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      clerkUserId = req.query.mockUserId || "mock_clerk_user_id";
    }

    const originalOrder = await Order.findOne({ _id: req.params.id, clerkUserId });
    if (!originalOrder) {
      return res.status(404).json({ message: "Original order not found" });
    }

    // Validate stock for reorder
    for (const item of originalOrder.items) {
      const product = await Product.findOne({ sku: item.sku });
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} is no longer available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
    }

    // Return items data for frontend to initiate a new checkout
    res.json({
      success: true,
      message: "Reorder data ready",
      items: originalOrder.items,
      shippingAddress: originalOrder.shippingAddress,
    });
  } catch (error) {
    console.error("Reorder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
