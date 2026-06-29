const { Webhook } = require("svix");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const crypto = require("crypto");

exports.handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("❌ CLERK_WEBHOOK_SECRET is not defined in environment variables");
    return res.status(500).json({ error: "Webhook secret is not configured" });
  }

  // Retrieve Svix headers
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // Verify headers exist
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  // Get raw body as a string
  const payload = req.body.toString();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  // Verify signature
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`📡 Clerk Webhook received: ${eventType} (User ID: ${id})`);

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { email_addresses, first_name, last_name, image_url } = evt.data;
      
      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || "Clerk User";

      const updatedUser = await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email,
          name,
          profileImageUrl: image_url,
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Synced user in MongoDB: ${updatedUser.name} (${updatedUser.email})`);
    } else if (eventType === "user.deleted") {
      const deletedUser = await User.findOneAndDelete({ clerkId: id });
      if (deletedUser) {
        console.log(`✅ Deleted user from MongoDB: ${deletedUser.name}`);
      } else {
        console.log(`ℹ️ User with ID ${id} was not found in MongoDB`);
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("❌ Error syncing user to database:", error);
    res.status(500).json({ error: "Internal database sync error" });
  }
};

// Handle Razorpay Payment Webhooks (asynchronous confirmation)
exports.handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET is not defined in environment variables");
    return res.status(500).json({ error: "Webhook secret is not configured" });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    return res.status(400).json({ error: "Missing x-razorpay-signature header" });
  }

  // Get raw body as string/buffer
  const payload = req.body.toString();

  // Verify signature
  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("hex");

  if (calculatedSignature !== signature) {
    console.error("❌ Razorpay webhook signature verification failed");
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    const event = JSON.parse(payload);
    console.log(`📡 Razorpay Webhook received event: ${event.event}`);

    // Update order status if payment was captured or order paid
    if (event.event === "order.paid" || event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.status !== "paid") {
          order.status = "paid";
          order.razorpayPaymentId = razorpayPaymentId;
          await order.save();

          // Trigger order confirmation email asynchronously
          const { sendOrderConfirmationEmail } = require("../utils/emailService");
          sendOrderConfirmationEmail(order).catch(err => console.error("❌ Webhook: Failed to send order confirmation email:", err));

          // Decrement stock levels
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }
            );
            console.log(`📉 Webhook: Decrement stock for Product ID: ${item.productId} by ${item.quantity}`);
          }
          console.log(`✅ Webhook: Order for Razorpay ID ${razorpayOrderId} marked as paid successfully`);
        }

        // Upsert payment details on Webhook
        const paymentUpdate = {
          razorpayPaymentId,
          status: "captured",
          method: paymentEntity.method,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
        };
        if (paymentEntity.method === "card" && paymentEntity.card) {
          paymentUpdate.cardLast4 = paymentEntity.card.last4;
        } else if (paymentEntity.method === "upi") {
          paymentUpdate.vpa = paymentEntity.vpa;
        } else if (paymentEntity.method === "netbanking") {
          paymentUpdate.bank = paymentEntity.bank;
        } else if (paymentEntity.method === "wallet") {
          paymentUpdate.wallet = paymentEntity.wallet;
        }

        const Payment = require("../models/Payment");
        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          { $set: paymentUpdate },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Razorpay webhook processing error:", error);
    res.status(500).json({ error: "Internal processing error" });
  }
};

