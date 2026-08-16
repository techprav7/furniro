const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  sku: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String
  }
});

const orderSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      index: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    razorpayPaymentId: {
      type: String
    },
    razorpaySignature: {
      type: String
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "dispatched",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "return_requested",
        "returned",
        "exchange_requested",
        "replaced",
        "refunded"
      ],
      default: "pending"
    },
    trackingNumber: {
      type: String,
      trim: true
    },
    courierPartner: {
      type: String,
      trim: true
    },
    deliveryNotes: {
      type: String,
      trim: true
    },
    refundAmount: {
      type: Number
    },
    refundId: {
      type: String
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    returnReason: {
      type: String,
      trim: true
    },
    exchangeReason: {
      type: String,
      trim: true
    },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      companyName: { type: String },
      country: { type: String, default: "India" },
      streetAddress: { type: String, required: true },
      townCity: { type: String, required: true },
      province: { type: String },
      zipCode: { type: String, required: true },
      email: { type: String, required: true }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
