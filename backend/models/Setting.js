const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "Furniro",
      trim: true,
    },
    storeEmail: {
      type: String,
      default: "tech.prav7@gmail.com",
      trim: true,
    },
    storePhone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    storeAddress: {
      type: String,
      default: "400 University Drive Suite 200 Coral Gables, FL 33134 USA",
      trim: true,
    },
    businessHours: {
      type: String,
      default: "Monday-Friday: 9:00 - 20:00, Saturday-Sunday: 9:00 - 14:00",
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      default: "",
    },
    taxPercentage: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    freeShippingThreshold: {
      type: Number,
      default: 50000,
      min: 0,
    },
    currencyCode: {
      type: String,
      default: "INR",
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: "₹",
      trim: true,
    },
    socialInstagram: {
      type: String,
      trim: true,
      default: "https://instagram.com/furniro",
    },
    socialFacebook: {
      type: String,
      trim: true,
      default: "https://facebook.com/furniro",
    },
    socialTwitter: {
      type: String,
      trim: true,
      default: "https://twitter.com/furniro",
    },
    socialPinterest: {
      type: String,
      trim: true,
      default: "https://pinterest.com/furniro",
    },
    returnPolicy: {
      type: String,
      default: "We offer a 30-day return policy for all furniture items in original condition. Return shipping fees may apply.",
    },
    privacyPolicy: {
      type: String,
      default: "Furniro values your privacy. We strictly secure customer information and never sell your personal data.",
    },
    termsOfService: {
      type: String,
      default: "By purchasing on Furniro, you agree to our standard terms of trade, delivery timelines, and warranty policies.",
    },
    shippingPolicy: {
      type: String,
      default: "Orders are dispatched within 2-3 business days. Free standard delivery applies to eligible threshold orders.",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);
