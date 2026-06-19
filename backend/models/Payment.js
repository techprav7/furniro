const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
    },
    method: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "emi", "bank_transfer", null],
      default: null,
    },
    cardLast4: {
      type: String,
      trim: true,
    },
    bank: {
      type: String,
      trim: true,
    },
    wallet: {
      type: String,
      trim: true,
    },
    vpa: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    errorCode: {
      type: String,
    },
    errorDescription: {
      type: String,
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
